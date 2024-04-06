import { faker } from "@faker-js/faker";
import fs from "fs";
import ADB from "./utils/adb.js";
import {
  delay,
  delayRandom,
  getRandomNumber,
  logg,
  readAndRemoveLine,
  refreshIp,
} from "./utils/helper.js";
import LDPlayer from "./utils/ldplayer.js";

class Reg {
  constructor(ebayInfo) {
    this.index = 0;
    this.ldPlayer = new LDPlayer();
    this.ebayInfo = ebayInfo;
  }

  async reg(profile) {
    try {
      const { email, fname, lname, password } = this.ebayInfo;
      // await profile.tapXml("com.ebay.mobile:id/ui_bottom_nav_menu_action_home");
      await delay(5);
      // await profile.tapXml("com.ebay.mobile:id/button_sign_in");

      await delay(5);
      await profile.tapXml(`com.ebay.mobile:id/button_create_account`);

      await delayRandom(1, 3);
      await profile.tapXml(`com.ebay.mobile:id/button_classic`);

      await delayRandom(1, 3);
      await profile.tapXml(`com.ebay.mobile:id/et_email`);
      await delay(1);
      await profile.sendText(email);

      await delayRandom(1, 3);
      await profile.tapXml(`com.ebay.mobile:id/et_given_name`);
      await delay(1);
      await profile.sendText(fname);

      await delayRandom(1, 3);
      await profile.tapXml(`com.ebay.mobile:id/et_family_name`);
      await delay(1);
      await profile.sendText(lname);

      await delayRandom(1, 3);
      await profile.tapXml(`com.ebay.mobile:id/button_continue`);

      await delay(20);
      await profile.tapXml(`com.ebay.mobile:id/password_input_text`);
      await delay(1);
      await profile.sendText(password);

      await delayRandom(1, 3);
      await profile.tapXml(`com.ebay.mobile:id/button_continue`);

      await delay(20);
      return true;
    } catch (error) {
      console.log({ error });
      logg(error);
      return false;
    }
  }

  async trackNewAccount(profile, tryed = 0) {
    try {
      logg(`Lấy username lần thứ ${tryed + 1}`);
      await delay(5);
      await profile.tapXml(
        `com.ebay.mobile:id/ui_bottom_nav_menu_action_my_ebay`
      );

      await delay(5);
      const username = profile.getUsernameAccount(
        "com.ebay.mobile:id/myebay_summary_compose_view"
      );
      if (!username && tryed < 5)
        return await this.trackNewAccount(profile, tryed + 1);
      await delay(2);
      if (username) profile.rename(username);

      const successAccountPath = "results/successAccount.txt";
      fs.appendFileSync(
        successAccountPath,
        `${username || "Không lấy được username"}|${this.ebayInfo.email}\n`,
        "utf8"
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async backupProfile(profile) {
    if (profile.isDeviceRunning()) profile.close();
    await delay(2);
    profile.backup();
    logg(`backup thành công`);
    profile.rename("base");
    await delay(2);
  }

  async ebayViewProduct(profile, qty = 1) {
    try {
      await delayRandom(5, 10);
      // search product
      await profile.tapXml("com.ebay.mobile:id/ui_bottom_nav_menu_action_home");
      await profile.randomSwipe();

      await delay(1);
      await profile.tapXml(
        "com.ebay.mobile:id/ui_bottom_nav_menu_action_search"
      );
      const productRandom = faker.commerce.productName();
      logg(`Search product ${productRandom}`);
      await delayRandom(2, 5);
      await profile.sendText(productRandom);
      await delayRandom();
      profile.keyEvent(ADB.KEYCODE_ENTER);
      await delayRandom(10, 15);

      // view 3 item
      for (let i = 0; i < qty; i++) {
        logg(`Xem item lần thứ ${i + 1}`);
        // swipe random
        await profile.randomSwipe();

        // Tap random product
        const isClickedProduct = profile.tapRandomEbayProduct(
          "com.ebay.mobile:id/cell_collection_item"
        );
        const imagesPos = profile.getPosXml(
          "com.ebay.mobile:id/imageview_image"
        );

        await delayRandom(2, 5);

        if (isClickedProduct) {
          // swipe images
          for (let ii = 0; ii < 6; ii++) {
            const randomLeftOrRight = getRandomNumber(0, 2);

            let x = imagesPos[0] + 400;
            let x2 = imagesPos[0] + 400;
            let y = imagesPos[1];

            if (randomLeftOrRight === 1) {
              x2 = x2 + 200;
            } else {
              x2 = x2 - 200;
            }
            if (getRandomNumber(1, 3) == 2) {
              await profile.tapXml("com.ebay.mobile:id/imageview_image");
              await delayRandom(1, 3);
              await profile.randomSwipe(2, 5);
              profile.click(5, 42);
              break;
            } else {
              profile.swipe(x, y, x2, y, 200);
              await delayRandom(1, 3);
            }
          }

          let viewAboutItem = {
            key: "content-desc",
            value: "More information - About this item",
            viewed: false,
          };

          let viewDescriptionItem = {
            key: "content-desc",
            value: "See full description",
            viewed: false,
          };

          let viewProductDetail = {
            key: "content-desc",
            value: "Product details",
            viewed: false,
          };

          let swipeCarouselItems = {
            key: "resource-id",
            value: "com.ebay.mobile:id/recyclerview_items",
            viewed: false,
          };
          // swipe random
          for (let iindex = 0; iindex < getRandomNumber(13, 15); iindex++) {
            await profile.swipe(
              getRandomNumber(300, 500),
              getRandomNumber(700, 800),
              getRandomNumber(300, 500),
              getRandomNumber(500, 600),
              getRandomNumber(300, 500)
            );
            const viewAboutItemPos = await profile.getPos({ ...viewAboutItem });
            const viewDescriptionItemPos = await profile.getPos({
              ...viewDescriptionItem,
            });
            const viewProductDetailPos = await profile.getPos({
              ...viewProductDetail,
            });
            const swipeCarouselItemsPos = await profile.getPos({
              ...swipeCarouselItems,
            });

            if (!isNaN(viewAboutItemPos?.x1) && !viewAboutItem.viewed) {
              profile.click(
                getRandomNumber(viewAboutItemPos.x1, viewAboutItemPos.x2),
                getRandomNumber(viewAboutItemPos.y1, viewAboutItemPos.y2)
              );
              viewAboutItem = { ...viewAboutItem, viewed: true };
              await delayRandom(7, 10);
              await profile.swipe(
                getRandomNumber(300, 500),
                getRandomNumber(700, 800),
                getRandomNumber(300, 500),
                getRandomNumber(150, 200),
                getRandomNumber(300, 500)
              );
              await delayRandom(5, 7);
              profile.click(50, 80);
              continue;
            }
            if (
              !isNaN(viewDescriptionItemPos?.x1) &&
              !viewDescriptionItem.viewed
            ) {
              viewDescriptionItem = { ...viewDescriptionItem, viewed: true };
              profile.click(
                getRandomNumber(
                  viewDescriptionItemPos.x1,
                  viewDescriptionItemPos.x2
                ),
                getRandomNumber(
                  viewDescriptionItemPos.y1,
                  viewDescriptionItemPos.y2
                )
              );

              await profile.randomSwipe();
              profile.click(5, 42);
              continue;
            }
            if (!isNaN(viewProductDetailPos?.x1) && !viewProductDetail.viewed) {
              viewProductDetail = { ...viewProductDetail, viewed: true };
              profile.click(
                getRandomNumber(
                  viewProductDetailPos.x1,
                  viewProductDetailPos.x2
                ),
                getRandomNumber(
                  viewProductDetailPos.y1,
                  viewProductDetailPos.y2
                )
              );
              await delayRandom(7, 10);
              await profile.swipe(
                getRandomNumber(300, 500),
                getRandomNumber(700, 800),
                getRandomNumber(300, 500),
                getRandomNumber(150, 200),
                getRandomNumber(300, 500)
              );
              await delayRandom(5, 7);
              profile.click(50, 80);
              continue;
            }
            if (
              !isNaN(swipeCarouselItemsPos?.x1) &&
              !swipeCarouselItems.viewed
            ) {
              swipeCarouselItems = { ...swipeCarouselItems, viewed: true };

              for (let silic = 0; silic < getRandomNumber(2, 4); silic++) {
                console.log({ swipeCarouselItemsPos });
                await profile.swipe(
                  swipeCarouselItemsPos.x2 - getRandomNumber(60, 100),
                  swipeCarouselItemsPos.y1 + 100,
                  swipeCarouselItemsPos.x1 + getRandomNumber(60, 100),
                  swipeCarouselItemsPos.y1 + 100,
                  getRandomNumber(200, 300)
                );
                await delayRandom(1, 2);
              }
            }
            await delayRandom(1, 2);
          }

          //back to search page
          profile.click(5, 42);
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async run(refreshIPLink) {
    try {
      const profile = this.ldPlayer;
      profile.info("index", this.index, this.ebayInfo);
      console.log(this.ldPlayer);
      profile.changeInfo();
      logg(`Đang mở profile id ${this.index}`);
      profile.start();
      await delay(1);
      // Đợi profile mở thành công
      // await retry(
      //   `ldconsole adb --index ${this.index} --command "shell input tap 0 0"`
      // );
      // logg("Kết nối thành công");
      // profile.close();

      // // refresh IP here
      await delay(2);
      logg(`Đang đổi IP`);
      const isRefreshSuccess = await refreshIp(refreshIPLink);
      if (!isRefreshSuccess) {
        logg("Đổi IP không thành công");
        return "REFRESH_IP_FAIL";
      }
      logg("Đổi IP thành công");
      await delay(10);

      await delay(1);
      logg(`Đang bật socks`);
      profile.openApp("net.typeblog.socks");
      await delay(5);
      await profile.tapXml(`net.typeblog.socks:id/switch_action_button`);
      await delay(2);
      logg(`Quay về màn hình chính`);
      profile.keyEvent(ADB.KEYCODE_HOME);
      await delay(10);

      // Open ebay app
      logg(`Đang đợi mở ebay`);
      profile.stopApp("com.ebay.mobile");
      profile.deleteCache("com.ebay.mobile");
      await delay(10);
      profile.openApp("com.ebay.mobile");

      await delay(4);
      // await profile.tapXml(`com.ebay.mobile:id/identity_app_onboarding_screen_close`);
      // await delay(15);
      // await this.ebayViewProduct(profile, 1, true);
      logg(`Chuẩn bị tạo acc`);
      if (!(await this.reg(profile))) {
        profile.close();
        await delay(2);
        return false;
      }

      logg(`Chuẩn bị tìm username`);
      if (!(await this.trackNewAccount(profile))) {
        profile.close();
        await delay(2);
        return false;
      }

      logg(`Chuẩn bị view sản phẩm`);
      await this.ebayViewProduct(profile, 4);
      await delay(2);

      logg(`Chuẩn bị backup`);
      await this.backupProfile(profile);

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

const slReg = 100;
const baseLD = "base";
const refreshIPLink =
  "https://portal.mobilehop.com/proxies/c08c3adca02d499d908bf65aae329ab1/reset";

// const thread = new Reg(
//   allDevices.find((dv) => dv.name === baseLD),
//   {}
// );

// await thread.run();

for (let index = 0; index < slReg; index++) {
  const infoString = await readAndRemoveLine("datas/info.txt");
  const [email, fname, lname, password] = infoString.split("|");
  const thread = new Reg({
    email,
    fname,
    lname,
    password,
  });

  const result = await thread.run(refreshIPLink);
  if (!result) continue;
  if (result === "REFRESH_IP_FAIL") break;
  await delay(5);
}
