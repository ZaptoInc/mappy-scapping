const { install, resolveBuildId } = require('@puppeteer/browsers');
const path = require('path');

const puppeteer = require("puppeteer-core");
const express = require("express");
const { toXML } = require("jstoxml");
async function start() {
  const browserName = 'chrome'
  const platform = process.platform; // Get the platform (linux, win32, darwin)
  const buildId = await resolveBuildId(browserName, platform, "stable"); // Get the default browser version Puppeteer expects
  // Define the path where Chromium will be installed
  const cacheDir = path.join(process.cwd(), '.local-chromium');

  let installed = await install({
    browser: browserName,
    cacheDir,
    buildId,
  });

  console.log(`Chromium installed in ${cacheDir}`);

  const app = express();
  const browser = await puppeteer.launch({
    executablePath: installed.executablePath,
  });
  async function scapper(point_a, point_b) {
    const page = await browser.newPage();

    await page.goto(
      `https://fr.mappy.com/itineraire#/voiture/${point_a}/${point_b}/car/feuille_de_route/3`,
      {
        waitUntil: "networkidle0",
      }
    );

    const lengthElem = await page
      .locator(
        "#app > div > main > div._6M6JB > div > div.J50cU > div:nth-child(2) > ul > span:nth-child(2) > li > div:nth-child(2) > span:nth-child(1)"
      )
      .waitHandle();
    const timeElem = await page
      .locator(
        "#app > div > main > div._6M6JB > div > div.J50cU > div:nth-child(2) > ul > span:nth-child(2) > li > div.P9vdY > div.r7AxA.VMqSK"
      )
      .waitHandle();

    const length = await lengthElem?.evaluate((el) => el.textContent);
    const time = await timeElem?.evaluate((el) => el.textContent);
    page.close();
    return { length, time };
  }

  let cache = {}

  app.get("/trajet/:source/:destination", async (request, response) => {
    let format = "json"
    if (request.query.format) format = request.query.format.toLocaleLowerCase()
    const source = request.params.source;
    const destination = request.params.destination;
    let resp = {
      source,
      destination,
      length: -1,
      time: -1,
      status: false,
    };
    if (format === "json" | format === "xml") {

      try {
        let scrap = undefined
        if(cache[`${source}_${destination}`]) {
            scrap = cache[`${source}_${destination}`]
        } else {
          scrap = await scapper(source, destination);
          cache[`${source}_${destination}`] = scrap
        }
         
        resp.length = scrap.length;
        resp.time = scrap.time;
        resp.status = true;
      } catch (error) {
        console.error(error)
      }
      if (format === "json") {
        response.type('application/json');
        response.send(resp);
      } else if (format === "xml") {
        response.type('application/xml');
        response.send(toXML({data : resp}, {header : true}));
      } else {
        response.send(`Invalid format ${format}`);
      }
    } else {
      response.send(`Invalid format ${format}`);
      return
    }

  });

  const port = 8080;
  app.listen(port, () => {
    console.log(`Serveur à l'écoute sur le port ${port}`);
  });
}

start();
