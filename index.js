const pupperteer = require("puppeteer");
const express = require("express");
async function start() {
  const app = express();
  const browser = await pupperteer.launch();
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
  app.get("/trajet/:source/:destination", async (request, response) => {
    const source = request.params.source;
    const destination = request.params.destination;
    let resp = {
      source,
      destination,
    };
    try {
      let scrap = await scapper(source, destination);
      resp.length = scrap.length;
      resp.time = scrap.time;
      resp.status = true;
    } catch (error) {
      resp.length = -1;
      resp.time = -1;
      resp.status = false;
    }
    response.send(resp);
  });

  const port = 8080;
  app.listen(port, () => {
    console.log(`Serveur à l'écoute sur le port ${port}`);
  });
}

start();

// scapper();
