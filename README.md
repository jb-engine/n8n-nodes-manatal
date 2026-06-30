# @manatal/n8n-nodes-manatal

This is an n8n community node. It lets you use Manatal in your n8n workflows.

Manatal is a cloud-based Applicant Tracking System (ATS) built for recruiters and HR teams. It centralises candidate pipelines, job postings, contacts, and organisations in one platform.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Core Resources

| Resource         | Create | Get | Get Many | Update |
| ---------------- | :----: | :-: | :------: | :----: |
| **Candidate**    |   ✓    |  ✓  |    ✓     |   ✓    |
| **Contact**      |   ✓    |  ✓  |    ✓     |   ✓    |
| **Job**          |   ✓    |  ✓  |    ✓     |   ✓    |
| **Match**        |   ✓    |  ✓  |    ✓     |   ✓    |
| **Organization** |   ✓    |  ✓  |    ✓     |   ✓    |

### Notes

| Resource              | Create | Get | Get Many | Update |
| --------------------- | :----: | :-: | :------: | :----: |
| **Candidate Note**    |   ✓    |  ✓  |    ✓     |   ✓    |
| **Contact Note**      |   ✓    |  ✓  |    ✓     |   ✓    |
| **Job Note**          |   ✓    |  ✓  |    ✓     |   ✓    |
| **Match Note**        |   ✓    |  ✓  |    ✓     |   ✓    |
| **Organization Note** |   ✓    |  ✓  |    ✓     |   ✓    |

### Attachments

| Resource                    | Create | Get | Get Many | Update |
| --------------------------- | :----: | :-: | :------: | :----: |
| **Candidate Attachment**    |   ✓    |  ✓  |    ✓     |   ✓    |
| **Contact Attachment**      |   ✓    |  ✓  |    ✓     |   ✓    |
| **Job Attachment**          |   ✓    |  ✓  |    ✓     |   ✓    |
| **Match Attachment**        |   ✓    |  ✓  |    ✓     |   ✓    |
| **Organization Attachment** |   ✓    |  ✓  |    ✓     |   ✓    |

### Candidate Sub-resources

| Resource                   | Operations            |
| -------------------------- | --------------------- |
| **Candidate Match**        | Get, Get Many         |
| **Candidate Resume**       | Get, Upload           |
| **Candidate Social Media** | Create, Get, Get Many |

### Job Sub-resources

| Resource      | Operations    |
| ------------- | ------------- |
| **Job Match** | Get, Get Many |

**Get Many** operations support a **Return All** toggle to auto-paginate through all results, a **Limit** to cap results, and resource-specific **Filters** including date ranges and field search.

### Trigger Node

Starts a workflow automatically when a selected event occurs in Manatal. Activating the workflow registers the webhook with Manatal — it deregisters automatically on deactivation.

| Resource  | Events                        |
| --------- | ----------------------------- |
| Candidate | Created, Updated              |
| Contact   | Created, Updated              |
| Match     | Created, Moved (stage change) |
| Job       | Status Updated                |

## Credentials

You will need a Manatal account with Admin access to generate an API token.

1. In Manatal, go to **Administration → Features → Open API**
2. Generate or copy your API token
3. In n8n, create a **Manatal Open API** credential and paste the token

The token is verified by calling `GET /users/` when you click **Test credential** in n8n.

For full details see the [Manatal API Getting Started guide](https://developers.manatal.com/reference/getting-started).

## Compatibility

Tested against n8n version 2.x. No known incompatibilities with earlier versions.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Manatal API Reference](https://developers.manatal.com/reference/getting-started)
- [Manatal Support Documentation](https://support.manatal.com/)

## License

[MIT](LICENSE.md)
