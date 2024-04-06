import { logg } from "../utils/helper.js";
import LDPlayer from "../utils/ldplayer.js";

const BASE_PROFILE_NAME = "BINNEEEE";
const accounts = await readAndRemoveLine("account.txt");
const refreshIPLink =
  "https://portal.mobilehop.com/proxies/e74dab0151e44c12abf4325fae5b5480/reset";

class Login {
  constructor(ldProfile, ebayInfo) {
    this.ldProfile = ldProfile;
    this.index = ldProfile["index"];
    this.profile = new LDPlayer();
    this.ebayInfo = ebayInfo;
  }

  async backup() {}

  async login() {}

  async copyBaseProfile() {}

  async run() {}
}

for (let index = 0; index < slReg; index++) {
  const [email, fname, lname, password] = infoString.split("|");

  try {
    this.profile.create(BASE_PROFILE_NAME);
  } catch (error) {}

  const thread = new Login(
    allDevices.find((dv) => dv.name === baseLD),
    {
      email,
      password,
    }
  );

  const result = await thread.run(refreshIPLink);
  if (result === "NOT_EXITS_ACCOUNT") break;
}
