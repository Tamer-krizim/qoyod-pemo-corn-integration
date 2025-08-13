# Pemo → Qoyod Sync Cron Job

This repository contains a simple serverless function and configuration for deploying a daily cron job on [Vercel](https://vercel.com/).  The job fetches expense transactions from the Pemo API, converts them into invoices, sends them to the Qoyod accounting platform, and marks the processed transactions as exported.

## Files

| File/Directory       | Description |
|----------------------|-------------|
| `api/sync-invoices.js` | Serverless function that fetches transactions from Pemo, sends invoices to Qoyod, and updates Pemo. |
| `vercel.json` | Configuration file defining the cron schedule and route for the job【66074166207259†L1214-L1222】. |
| `package.json` | Basic project metadata and placeholder script. |

## Setup

1. Create a new project on Vercel and import this repository.  Alternatively, you can use the Vercel CLI to deploy directly from your local machine.
2. Define the following environment variables in your Vercel project settings:
   - `PEMO_API_KEY` – The API key you obtained from Pemo to authenticate requests.
   - `QOYOD_API_KEY` – Your Qoyod API key.  You can generate one from the **General Settings** in your Qoyod dashboard.
   - `QOYOD_DEBIT_ACCOUNT_ID` – رقم حساب المصروف (الحساب الذي سيتم تخصيصه كمدين) في قيود.
   - `QOYOD_CREDIT_ACCOUNT_ID` – رقم حساب النقدية أو البنك (الحساب الذي سيتم تخصيصه كدائن) في قيود.

3. Adjust the cron schedule in `vercel.json` if you need a different run time.  The default (`"0 5 * * *"`) runs daily at 05:00 UTC【66074166207259†L1224-L1229】.

4. Deploy the project.  Vercel will create the cron job automatically upon deployment【66074166207259†L1230-L1243】.  You can trigger the function manually by visiting `/api/sync-invoices` on your production deployment.

## Customization

The implementation in `api/sync-invoices.js` includes a basic mapping between Pemo transactions and Qoyod invoices.  You may wish to refine the transformation logic by:

* Mapping each transaction to a specific contact based on the spender’s email or department.
* Using different products or line item descriptions based on the transaction’s category.
* Setting different due dates or statuses for the invoices.

Refer to the Qoyod API documentation for details on required fields and accepted values【386477009956224†screenshot】.

## License

MIT