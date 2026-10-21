# Usage Metering and Quota Service
A TypeScript-based API service for tracking usage, managing accounts and user quotas, and monthly usage limits.

## DEMO Recording
<a href="https://drive.google.com/drive/folders/1MgkT1MolVNEQ07lULjLg4KTkVXYlv-DN?usp=drive_link">DEMO Recording</a><br>

## Postman Documentation
<a href="https://documenter.getpostman.com/view/42991698/2sBYHURefx">Postman Documentation</a><br>

## Features
- Plan management: List available plans, view plans details, create custom-plan, or edit custom plan for the logged-in account.
- Account management: Create accounts, log in, view account details, and change account plans.
- User management: Create users, list users, view user details, and change user plans.
- Usage metering: Submit usage requests and view account or user usage.
- Quota management: Configure monthly usage limits and maximum units per request through plans.
- Usage history: Review usage history for the user or the account, and calculate total approved usage over a specified date range.
- Docker support: run the CLI or the API and its required services using Docker Compose.

## Prerequisites
Before running the project, ensure you have installed <br>
<a href="https://docs.docker.com/get-started/get-docker">Docker</a><br>
<a href="https://docs.docker.com/compose/">Docker Compose</a>

## How to start
1. clone the repository
   git clone <repository-url>
   cd Usage-Metering-Quota-Service
2. Configure environment variables
   Create a .env file in the project root directory
   put these variables:<br>
   PORT=....<br>
   DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/usage_metering<br>
   POSTGRES_PASSWORD=your_local_password<br>
   POSTGRES_PORT=....
3. Run the project:
   <p><strong>TO RUN THE API: <code>docker compose up -d api</code></strong></p>

   <p><strong>TO RUN THE CLI: <code>docker compose run --rm cli &lt;command&gt;</code></strong></p>

## CLI Usage
The general command format is:<br>
  docker compose run --rm cli &lt;command&gt;
  
### Plans Commands
<table>
  <thead>
    <tr>
      <th>Command</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>plans</code></td>
      <td>List all available plans.</td>
    </tr>
    <tr>
      <td><code>plan &lt;planId&gt;</code></td>
      <td>Get details of a specific plan.</td>
    </tr>
    <tr>
      <td><code>create-plan &lt;name&gt; &lt;monthlyLimit&gt; &lt;maxUnitsPerRequest&gt;</code></td>
      <td>Create a custom plan.</td>
    </tr>
    <tr>
      <td><code>edit-custom-plan &lt;planId&gt; &lt;name&gt; &lt;monthlyLimit&gt; &lt;maxUnitsPerRequest&gt;</code></td>
      <td>Edit a custom plan.</td>
    </tr>
  </tbody>
</table>

### Account Commands
<table>
  <thead>
    <tr>
      <th>Command</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>login &lt;apiKey&gt;</code></td>
      <td>Log in using an API key.</td>
    </tr>
    <tr>
      <td><code>logout</code></td>
      <td>Log out of the current account.</td>
    </tr>
    <tr>
      <td><code>create-account &lt;accountName&gt;</code></td>
      <td>Create a new account.</td>
    </tr>
    <tr>
      <td><code>my-account</code></td>
      <td>Display the current account.</td>
    </tr>
    <tr>
      <td><code>change-account-plan &lt;planId&gt;</code></td>
      <td>Change the account's plan.</td>
    </tr>
    <tr>
      <td><code>account-usage-plan</code></td>
      <td>Display the account's usage plan.</td>
    </tr>
    <tr>
      <td><code>account-usage-history</code></td>
      <td>Display the account's usage history.</td>
    </tr>
    <tr>
      <td><code>account-sum-approved-usage &lt;startDate&gt; &lt;endDate&gt;</code></td>
      <td>Calculate approved usage within a date range.</td>
    </tr>
    <tr>
      <td><code>account-usage</code></td>
      <td>Display account usage.</td>
    </tr>
  </tbody>
</table>

### Users Commands
<table>
  <thead>
    <tr>
      <th>Command</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>list-users</code></td>
      <td>List users.</td>
    </tr>
    <tr>
      <td><code>get-user &lt;user-id&gt;</code></td>
      <td>Get details of a specific user.</td>
    </tr>
    <tr>
      <td><code>create-user &lt;userName&gt; &lt;planId&gt;</code></td>
      <td>Create a user and assign a plan.</td>
    </tr>
    <tr>
      <td><code>change-user-plan &lt;userId&gt; &lt;planId&gt;</code></td>
      <td>Change a user's plan.</td>
    </tr>
    <tr>
      <td><code>user-usage &lt;userId&gt;</code></td>
      <td>Display a user's usage.</td>
    </tr>
    <tr>
      <td><code>user-usage-history &lt;userId&gt;</code></td>
      <td>Display a user's usage history.</td>
    </tr>
  </tbody>
</table>

### Usage Commands
<table>
  <thead>
    <tr>
      <th>Command</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>consume-usage &lt;userId&gt; &lt;units&gt;</code></td>
      <td>Consume usage units from a user.</td>
    </tr>
  </tbody>
</table>

### Help
Display the available commands:<br>
  docker compose run --rm cli help

## Testing
The project contains the unit tests performed for the app in the folder test/

## Performance Testing results
the results are displayed in /performance/results.txt

The API was tested with sequential and concurrent requests to evaluate response time and reliability.

<table>
  <thead>
    <tr>
      <th>Metric</th>
      <th>Sequential (10 Requests)</th>
      <th>Sequential (100 Requests)</th>
      <th>Concurrent (100 Requests)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Total Requests</td>
      <td>10</td>
      <td>100</td>
      <td>100</td>
    </tr>
    <tr>
      <td>Successful Requests</td>
      <td>10</td>
      <td>100</td>
      <td>100</td>
    </tr>
    <tr>
      <td>Failed Requests</td>
      <td>0</td>
      <td>0</td>
      <td>0</td>
    </tr>
    <tr>
      <td>Success Rate</td>
      <td>100%</td>
      <td>100%</td>
      <td>100%</td>
    </tr>
    <tr>
      <td>Total Execution Time</td>
      <td>143 ms</td>
      <td>1,094 ms</td>
      <td>1,381 ms</td>
    </tr>
    <tr>
      <td>Average Time per Request</td>
      <td>14.30 ms</td>
      <td>10.94 ms</td>
      <td>13.81 ms</td>
    </tr>
  </tbody>
</table>

<h3>Key Findings</h3>

<ul>
  <li><strong>Reliability:</strong> All 210 requests completed successfully, achieving a 100% success rate.</li>
  <li><strong>Response Time:</strong> Average request times ranged from 10.94 ms to 14.30 ms across the three tests.</li>
</ul>

<h3>Summary</h3>

<p>
  The API successfully handled both sequential and concurrent requests during testing with no failed requests and low average response times.
  These results establish an initial performance baseline. However, additional tests with higher concurrency and worloads are needed to ensure scalability.
</p>
