import { WebhookPayloadIssueComment } from "@octokit/webhooks"
import { Context, Logger } from "@azure/functions"
import { createGitHubClient } from "./util/createGitHubClient"
import { Octokit } from "@octokit/rest"
import { sha } from "./sha"
import { mergeThroughCodeOwners } from "./checks/mergeThroughCodeOwners"
import { addOrRemoveReprosLabelOnComments } from "./checks/addOrRemoveReprosLabel"

export const anyRepoHandleIssueCommentPayload = async (payload: WebhookPayloadIssueComment, context: Context) => {
  const api = createGitHubClient()
  const ran = [] as string[]

  const run = (
    name: string,
    fn: (api: Octokit, payload: WebhookPayloadIssueComment, logger: Logger) => Promise<void>
  ) => {
    context.log.info(`\n\n## ${name}\n`)
    ran.push(name)
    return fn(api, payload, context.log)
  }

  // Making this one whitelisted to the website for now
  if (payload.repository.name === "TypeScript-Website") {
    await run("Checking if we should merge from codeowners", mergeThroughCodeOwners)
  }

  if (payload.repository.name === "TypeScript") {
    await run("Checking if we should add the repros label", addOrRemoveReprosLabelOnComments)
  }

  context.res = {
    status: 200,
    headers: { sha: sha },
    body: `Success, ran: ${ran.join(", ")}`,
  }
}
