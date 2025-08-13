/**
 * Serverless function to sync invoices between Pemo and Qoyod.
 *
 * This function is designed to run on Vercel as a cron job. It performs the
 * following steps:
 *   1. Fetches transactions from the Pemo API that are ready to be exported.
 *   2. Transforms each transaction into a Qoyod invoice payload and
 *      submits it to the Qoyod API.
 *   3. Marks the processed transactions in Pemo as exported to avoid
 *      re‑processing them in subsequent runs.
 *
 * The function expects several environment variables to be defined:
 *   - PEMO_API_KEY:       API key used to authenticate requests to Pemo.
 *   - QOYOD_API_KEY:      API key used to authenticate requests to Qoyod.
 *   - QOYOD_CONTACT_ID:   Default contact ID in Qoyod to assign invoices to.
 *   - QOYOD_INVENTORY_ID: Inventory ID in Qoyod where invoices should be recorded.
 *   - QOYOD_PRODUCT_ID:   Product ID in Qoyod representing a generic expense item.
 *
 * You can deploy this function with a corresponding cron entry in `vercel.json`.
 */

// Export the handler. Vercel will invoke this function when the cron job
// triggers or when the route is accessed directly.
module.exports = async (req, res) => {
  // Only accept GET requests – cron jobs trigger via GET.
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate required environment variables.
  const requiredEnv = [
    'PEMO_API_KEY',
    'QOYOD_API_KEY',
    'QOYOD_CONTACT_ID',
    'QOYOD_INVENTORY_ID',
    'QOYOD_PRODUCT_ID'
  ];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    res.status(500).json({
      error: `Missing required environment variables: ${missing.join(', ')}`
    });
    return;
  }

  try {
    // Step 1: Fetch transactions from Pemo that are ready to export.
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
    // The API returns an array of transactions under the `transactions` property.
    const transactions = Array.isArray(pemoData.transactions)
      ? pemoData.transactions
      : [];

    // If there are no transactions to export, return early.
    if (transactions.length === 0) {
      res.status(200).json({ message: 'No transactions to export' });
      return;
    }

    // Prepare an array to collect transaction IDs for marking as exported later.
    const exportedIds = [];

    // Step 2: For each transaction, build and send a Qoyod invoice.
    for (const txn of transactions) {
      // Skip if essential fields are missing.
      if (
        !txn ||
        typeof txn.totalAmount !== 'number' ||
        !txn.date ||
        !txn.id
      ) {
        continue;
      }

      // Convert the transaction amount from smallest units (e.g. fils/cents) to
      // currency units. Qoyod expects amounts in full currency units.
      const amount = txn.totalAmount / 100;

      // Determine the invoice dates. Use the transaction date as both the
      // issue_date and due_date for simplicity. You can customize this
      // behaviour as needed.
      const issueDate = new Date(txn.date).toISOString().split('T')[0];
      const dueDate = issueDate;

      // Build the invoice payload according to Qoyod's API specification.
      const invoicePayload = {
        invoice: {
          contact_id: parseInt(process.env.QOYOD_CONTACT_ID, 10),
          // The reference can be the Pemo transaction ID to keep track of the
          // source record. This field is optional in Qoyod.
          reference: txn.id,
          description: txn.merchant || 'Pemo Transaction',
          issue_date: issueDate,
          due_date: dueDate,
          // Status can be "Approved" to auto‑approve the invoice. Use
          // "draft" if you prefer to review invoices manually in Qoyod.
          status: 'Approved',
          inventory_id: parseInt(process.env.QOYOD_INVENTORY_ID, 10),
          line_items: [
            {
              product_id: parseInt(process.env.QOYOD_PRODUCT_ID, 10),
              description: txn.merchant || 'Expense',
              quantity: 1,
              unit_price: amount,
              // Unit type is optional; if omitted, Qoyod defaults to the
              // product's configured unit.
            }
          ]
        }
      };

      // Send the invoice to Qoyod.
      const qoyodResponse = await fetch(
        'https://www.qoyod.com/api/2.0/invoices',
        {
          method: 'POST',
          headers: {
            'API-KEY': process.env.QOYOD_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(invoicePayload)
        }
      );
      if (!qoyodResponse.ok) {
        const text = await qoyodResponse.text();
        console.error(
          `Failed to create Qoyod invoice for transaction ${txn.id}: ` +
            `${qoyodResponse.status} ${qoyodResponse.statusText}: ${text}`
        );
        // Continue processing other transactions instead of halting the job.
        continue;
      }

      // If invoice creation succeeded, add the transaction ID to exportedIds.
      exportedIds.push(txn.id);
    }

    // Step 3: Mark the processed transactions as exported in Pemo to prevent
    // re‑exporting them in future cron runs.
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

    // Respond with a summary of what was exported.
    res.status(200).json({
      exportedCount: exportedIds.length,
      exportedTransactionIds: exportedIds
    });
  } catch (error) {
    console.error('Error syncing invoices:', error);
    res.status(500).json({ error: error.message });
  }
};