/* eslint-disable dot-notation */
import test from '@lib/BaseTest'
import { expect, defineConfig, request } from "@playwright/test"
import { faker } from '@faker-js/faker'
import chalk from 'chalk'
// eslint-disable-next-line import/no-extraneous-dependencies
import winston from "winston"

const logLevel = `info`

const l = winston.createLogger({
    level: logLevel,
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console({
            level: logLevel,
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            ),
        }),
    ],
})

test.describe.configure({ mode: `parallel` })

export default defineConfig({
    use: {
        baseURL: `https://scoutcloud.services.blockscout.com`,
        extraHTTPHeaders: {
            Accept: `application/vnd.github.v3+json`,
            'x-api-key': process.env.SCOUTCLOUD_TOKEN,
        },
    },
})

const createInstance = async (r, cfg) => {
    const response = await r.post(`/api/v1/instances`, {
        data: cfg,
    })
    const bodyJSON = await response.json()
    l.info(`url requested: ${response.url()}`)
    l.info(`body: ${await response.body()}`)
    expect(response.ok()).toBeTruthy()
    return bodyJSON[`instance_id`]
}

const getInstances = async (r) => {
    const response = await r.get(`/api/v1/instances`)
    const bodyJSON = await response.json()
    l.info(`url requested: ${response.url()}`)
    l.info(`body: ${await response.body()}`)
    expect(response.ok()).toBeTruthy()
    return bodyJSON[`instance_id`]
}

const getInstance = async (r, instance) => {
    const resp = await r.get(`/api/v1/instances/${instance}`)
    const body = await resp.body()
    l.debug(`url requested: ${resp.url()}`)
    l.debug(`body: ${body}`)
}

const updateStatus = async (r, instance, cfg) => {
    const resp = await r.post(`/api/v1/instances/${instance}/status:update`, {
        data: cfg,
    })
    const body = await resp.body()
    l.info(`url requested: ${resp.url()}`)
    l.info(`body: ${body}`)
    const bodyJSON = await resp.json()
    return bodyJSON[`deployment_id`]
}

const getDeployment = async (r, deployment) => {
    const resp = await r.get(`/api/v1/deployments/${deployment}`)
    const body = await resp.body()
    const bodyJSON = await resp.json()
    l.debug(`url requested: ${resp.url()}`)
    l.debug(`body: ${body}`)
    return bodyJSON
}

const delay = async (time: number) => new Promise((resolve) => {
    setTimeout(resolve, time)
})

const waitForStatus = async (r, deployment, requiredStatus, waitMillis, retries) => {
    for (let i = 0; i < retries; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const deploymentInfo = await getDeployment(r, deployment)
        l.debug(`status: ${deploymentInfo[`status`]}, requiredStatus: ${requiredStatus}`)
        if (deploymentInfo[`status`] === requiredStatus) {
            l.debug(`Deployment ${deployment} is now ${requiredStatus}`)
            return
        }
        // eslint-disable-next-line no-await-in-loop
        await delay(waitMillis)
    }
    throw Error(`timeout waiting for deployment status`)
}

const getInstanceDeployments = async (r, instance) => {
    const resp = await r.get(`/api/v1/instances/${instance}/deployments`)
    const body = await resp.body()
    l.debug(`url requested: ${resp.url()}`)
    l.debug(`body: ${body}`)
}

// eslint-disable-next-line no-shadow
// test.skip(`@ScoutCloud Get status`, async ({ request }) => {
//     const response = await request.get(`/api/v1/users/profile`)
//     l.debug(`url requested: ${response.url()}`)
//     l.debug(`body: ${await response.body()}`)
//     expect(response.ok()).toBeTruthy()
// })

// test(`@ScoutCloud Stop static deployment`, async ({ request }) => {
//     const instanceID = ``
//     const deploymentID = ``
//     const status = await getDeployment(request, deploymentID)
//     l.info(`Blockscout URL: ${status[`blockscout_url`]}`)
//     await updateStatus(request, instanceID, { action: `STOP` })
//     await waitForStatus(request, deploymentID, `STOPPED`, 10000, 18)
// })

// eslint-disable-next-line no-shadow
test(`@ScoutCloud Create New Instance`, async ({ request, newHomePage }) => {
    const instanceID = await createInstance(request, {
        name: `autotest-${faker.random.alpha(8)}`,
        config: {
            rpc_url: process.env.SCOUTCLOUD_RPC_URL,
            server_size: process.env.SCOUTCLOUD_SERVER_SIZE,
            chain_type: process.env.SCOUTCLOUD_CHAIN_TYPE,
            node_type: process.env.SCOUTCLOUD_NODE_TYPE,
        },
    })
    await getInstance(request, instanceID)
    const deploymentID = await updateStatus(request, instanceID, { action: `START` })
    await waitForStatus(request, deploymentID, `RUNNING`, 10000, 50)
    const status = await getDeployment(request, deploymentID)
    const url = status[`blockscout_url`]
    l.info(`Blockscout URL: ${status[`blockscout_url`]}`)
    await newHomePage.open_custom(url)
    await newHomePage.checkIndexing()
    await newHomePage.checkHeader()
    await newHomePage.checkBlocksWidget()
    await updateStatus(request, instanceID, { action: `STOP` })
    await waitForStatus(request, deploymentID, `STOPPING`, 10000, 50)
})