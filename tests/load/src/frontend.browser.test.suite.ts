import { browser } from 'k6/experimental/browser'
import http from 'k6/http'

const url = __ENV.BASE_URL
const pageName = __ENV.PAGE
const iterations = __ENV.ITERATIONS
const vus = __ENV.VUS

export const options = {
    scenarios: {
        ui: {
            executor: `shared-iterations`,
            iterations,
            vus,
            options: {
                browser: {
                    type: `chromium`,
                },
            },
        },
    },
}

const openPage = async (pageName) => {
    const context = browser.newContext()
    const page = context.newPage()

    try {
        await page.goto(`${url}${pageName}`)
    } finally {
        page.close()
    }
}

export function handleSummary(data) {
    // eslint-disable-next-line no-param-reassign
    const payload = {
        streams: [
            {
                stream: {
                    test: `browser`,
                    page: pageName,
                },
                values: [
                    [`${new Date().getTime() * 1e6}`, JSON.stringify(data.metrics)],
                ],
            },
        ],
    }
    const LokiURL = `http://localhost:3100/loki/api/v1/push`
    const res = http.post(LokiURL, JSON.stringify(payload), {
        headers: { 'Content-Type': `application/json` },
    })
    console.log(res.status)
    console.log(res.body)
}

export default async function () {
    await openPage(pageName)
}