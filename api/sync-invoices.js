/**
 * Serverless function to sync invoices between Pemo and Qoyod.
 *
 * This function is designed to run on Vercel as a cron job. It performs the
 * following steps:
 *   1. Fetches transactions from the Pemo API that are ready to be exported.
 *   2. Transforms each transaction into a Qoyod journal entry payload and
 *      submits it to the Qoyod API.
 *   3. Marks the processed transactions in Pemo as exported to avoid
 *      re-processing them in subsequent runs.
 *
 * The function expects several environment variables to be defined:
 *   - PEMO_API_KEY:       API key used to authenticate requests to Pemo.
 *   - QOYOD_API_KEY:      API key used to authenticate requests to Qoyod.
 *
 * You can deploy this function with a corresponding cron entry in `vercel.json`.
 */

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate required environment variables.
  const requiredEnv = [
    'PEMO_API_KEY',
    'QOYOD_API_KEY'
  ];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    res.status(500).json({
      error: `Missing required environment variables: ${missing.join(', ')}`
    });
    return;
  }

  try {
    // Step 1: Fetch transactions from Pemo
    const pemoEndpoint =
      'https://external-api.pemo.io/v1/transactions?exportStatus=readyToExport';
    const pemoResponse = await fetch(pemoEndpoint, {
      headers: {
        apiKey: process.env.PEMO_API_KEY
      }
    });
    if (!pemoResponse.ok) {
      const text = await pemoResponse.text();
      throw new Error(
        `Failed to fetch Pemo transactions: ${pemoResponse.status} ${pemoResponse.statusText}: ${text}`
      );
    }
    const pemoData = await pemoResponse.json();
    const transactions = Array.isArray(pemoData.transactions)
      ? pemoData.transactions
      : [];

    if (transactions.length === 0) {
      res.status(200).json({ message: 'No transactions to export' });
      return;
    }

    const exportedIds = [];

    // Step 2: For each transaction, build and send a Qoyod journal entry.
    for (const txn of transactions) {
      if (
        !txn ||
        typeof txn.totalAmount !== 'number' ||
        !txn.date ||
        !txn.id
      ) {
        continue;
      }

      const amount = txn.totalAmount / 100;
      const issueDate = new Date(txn.date).toISOString().split('T')[0];

      const journalEntryPayload = {
        journal_entry: {
          description: txn.merchant || 'Pemo Transaction',
          date: issueDate,
          debit_amounts: [],
          credit_amounts: []
        }
      };

      const qoyodResponse = await fetch(
        'https://www.qoyod.com/api/2.0/journal_entries',
        {
          method: 'POST',
          headers: {
            'API-KEY': process.env.QOYOD_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(journalEntryPayload)
        }
      );
      if (!qoyodResponse.ok) {
        const text = await qoyodResponse.text();
        console.error(
          `Failed to create Qoyod journal entry for transaction ${txn.id}: ` +
            `${qoyodResponse.status} ${qoyodResponse.statusText}: ${text}`
        );
        continue;
      }

      exportedIds.push(txn.id);
    }

    // Step 3: Mark as exported
    if (exportedIds.length > 0) {
      const markResponse = await fetch(
        'https://external-api.pemo.io/v1/transactions',
        {
          method: 'PATCH',
          headers: {
            apiKey: process.env.PEMO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: 'markAsExported',
            transactionIds: exportedIds
          })
        }
      );
      if (!markResponse.ok) {
        const text = await markResponse.text();
        console.error(
          `Failed to mark Pemo transactions as exported: ${markResponse.status} ${markResponse.statusText}: ${text}`
        );
      }
    }

    res.status(200).json({
      exportedCount: exportedIds.length,
      exportedTransactionIds: exportedIds
    });
  } catch (error) {
    console.error('Error syncing invoices:', error);
    res.status(500).json({ error: error.message });
  }
};