import { faker } from "@faker-js/faker";
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import LDPlayer from "./utils/ldplayer.js";
import express from "express";
import { refreshIp } from "./utils/helper.js";
const app = express();
const port = 3001;

const axiosInstance = axios.create({
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

async function fetchHTML(url, wmCoookie) {
  try {
    const response = await axiosInstance.get(url, {
      headers: {
        Cookie: wmCoookie,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        Referer:
          "https://www.bootbarn.com/search?q=ariat&pmin=100.00&pmax=200.00",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    return response.data;
  } catch (error) {
    console.log("Error fetching the HTML:", error);
    return null;
  }
}

async function downloadImage(url, folder, filename) {
  try {
    const response = await axiosInstance.get(url, {
      responseType: "arraybuffer",
    });
    const filePath = path.join(folder, filename);
    fs.writeFileSync(filePath, response.data);

    console.log("Image downloaded successfully:", filePath);
    return path.join(process.cwd(), filePath);
  } catch (error) {
    console.error("Error downloading image:", error);
  }
}

async function main(index, wmCoookie, productUrl) {
  const html = await fetchHTML(productUrl, wmCoookie);

  if (!html) {
    console.error("No HTML fetched");
    return;
  }

  // Load HTML into cheerio
  const $ = cheerio.load(html);
  const image = $(`img[itemprop="image"]`).attr("src");
  const name = $(`h1[itemprop="name"]`).text().trim();
  const description = $(`.product-info`).text().trim();
  const brand = $(`.product-brand span`).text().trim();
  const price = $(`.product-price strong`).text().trim();
  const sku = "";

  const folder = "./images";
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const filenameImg = image.split("?")[0].split("/")[
    image.split("/").length - 1
  ];

  const pathImage = await downloadImage(image, folder, filenameImg);
  console.log({ pathImage });

  const ld = new LDPlayer();
  ld.info("index", index);
  ld.pushImg(pathImage, filenameImg);
  fs.unlink(pathImage, (err) => {
    if (err) {
      return;
    }
  });

  return {
    image,
    name,
    sku,
    description,
    brand: brand,
    price,
  };
}

// Thiết lập view engine là Pug
app.set("view engine", "pug");

// Thiết lập đường dẫn cho các tệp tĩnh
app.use(express.static("public"));

app.get("/clear", async (req, res) => {
  const baseLD = req.query.baseLD;
  console.log({ baseLD });

  const ld = new LDPlayer();
  const allLd = ld.getDevices2();
  const index = allLd.find((dv) => dv.name === baseLD).index;
  ld.info("index", index);
  ld.clearDownload();
  res.json({ result: "ok" });
});

app.get("/get", async (req, res) => {
  try {
    const baseLD = req.query.baseLD;
    const refreshIPLink = req.query.refreshIPLink;
    const wmCoookie = req.query.wmCoookie;
    const productUrl = req.query.productUrl;
    const isRefreshSuccess = await refreshIp(refreshIPLink);
    const ld = new LDPlayer();
    const allLd = ld.getDevices2();
    const data = await main(
      allLd.find((dv) => dv.name === baseLD).index,
      wmCoookie,
      productUrl
    );
    res.json({ success: true, isRefreshSuccess, data });
  } catch (error) {
    console.log(error);
    res.json({ success: false, error: JSON.stringify(error) });
  }
});

// Định nghĩa route để hiển thị dữ liệu
app.get("/", async (req, res) => {
  res.render("index-2");
});

// Khởi động máy chủ
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
