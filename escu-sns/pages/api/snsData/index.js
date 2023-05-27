import Cors from 'cors'
import UserAgent from 'user-agents';
const { chromium } = require('playwright');
const userAgent = new UserAgent();

const cors = Cors({
    methods: ['POST', 'GET', 'HEAD'],
})

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
      fn(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result)
        }
        return resolve(result)
      })
    })
}

const handler = async (req, res) => {

    await runMiddleware(req, res, cors)

    const { address } = req.query;

    const options = {
        userAgent: userAgent.toString()
    }

  try {

    console.log("STARTING SOLANA NAME SERVICE WORKER");

    const browser = await chromium.launch({
        headless: true,
        executablePath: '.vercel/.cache/ms-playwright/chromium-1064/chrome-linux/chrome'
    })

    const page = await browser.newPage(options)
    page.setDefaultTimeout(60000);

    await page.setViewportSize({ width: 1200, height: 800 })

    // page.on('request', (request) => console.log('>>', request.method(), request.url()))

    // page.on('response', async (response) => { console.log('<<', response.status(), response.url())})

    const responsePromise = page.waitForResponse(response => response.url() === `https://api.solscan.io/domain?address=${address}&cluster=` && response.status() === 200);
    await page.goto(`https://solscan.io/account/${address}`);
    const responseRaw = await responsePromise;
    const responseData = await responseRaw.json();

    await browser.close();

    res.status(200).json(responseData);

    console.log("STOPPING SOLANA NAME SERVICE WORKER");

  } catch (err) {
    const out = {
      error: "Something went wrong...",
      message: err.message,
    };

    res.status(500).json(out);
  }
};

export default handler;