const Signer = require('../');
const axios = require('axios'); // NOTE: not adding this to package.json, you'll need to install it manually

// Get your SEC_UID from https://t.tiktok.com/api/user/detail/?aid=1988&uniqueId=username&language=it
// where `username` is your TikTok username.
const SEC_UID =
  'MS4wLjABAAAAQ09e6Ck9CQrQQYAPLehEKMlvVS8XzmGcbNHTGXsXIZSIj7Pe21eYtDq0nzKy6-5V';

// We use Apple, based on the issue comments in the repo, this helps prevent TikTok's captcha from triggering
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Windows NT 10.0; Win64; x64) Chrome/90.0.4430.85 Safari/537.36';

// This the final URL you make a request to for the API call, it is ALWAYS this, do not mistaken it for the signed URL
const TT_REQ_PERM_URL =
  'https://www.tiktok.com/api/post/item_list/?aid=1988&app_language=en&app_name=tiktok_web&battery_info=0.79&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F103.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&device_id=7123312453912577542&device_platform=web_pc&focus_state=true&from_page=user&history_len=2&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=RO&screen_height=1120&screen_width=1792&tz_name=Europe%2FBucharest&webcast_language=en&msToken=L0PQGEFijfQjvebd0lu-QX6MtiZzqYTcT5VUZLIQeGwWcvRroaWvCOqeG2knoRYXGK17Dwz4vzfyBcL6Yyg-1BNN0nYGrMvOSFSRUNEHDYamOQFGs--wOGxN6Bf1qFYZU8YC4-7df-MfqTlzeN8=&X-Bogus=DFSzKIVLsehANn/hSIeTcp7TlqSV&_signature=_02B4Z6wo00001zt3GhgAAIDAr6FBFuCZlDc7Zh6AAKwR1f';

const PARAMS = {
  aid: 1988,
  count: 30,
  cursor: 0,
  secUid: SEC_UID,
  cookie_enabled: true,
  screen_width: 0,
  screen_height: 0,
  browser_language: '',
  browser_platform: '',
  browser_name: '',
  browser_version: '',
  browser_online: '',
  timezone_name: 'Europe/London',
};

async function main() {
  const signer = new Signer(null, USER_AGENT);
  await signer.init();

  const qsObject = new URLSearchParams(PARAMS);
  const qs = qsObject.toString();

  const unsignedUrl = `https://m.tiktok.com/api/post/item_list/?${qs}`;
  const signature = await signer.sign(unsignedUrl);
  const navigator = await signer.navigator();
  await signer.close();

  // We don't take the `signed_url` from the response, we use the `x-tt-params` header instead because TikTok has
  // some weird security considerations. I'm not sure if it's a local encode or they actually make a call to their
  // servers to get the signature back, but your API call params are in the `x-tt-params` header, which is used
  // when making the request to the static URL `TT_REQ_PERM_URL` above. I'm assuming because the library launches
  // a headless browser, it's a local encode.
  const { x_tt_params: xTtParams } = signature;
  const { user_agent: userAgent } = navigator;

  const res = await testApiReq({ userAgent, xTtParams });
  const { data } = res;
  console.log(data);
}

async function testApiReq({ userAgent, xTtParams }) {
  const options = {
    method: 'GET',
    headers: {
      'user-agent': userAgent,
      'x-tt-params': xTtParams,
      'cookie': 's_v_web_id=verify_l5x14w5p_PoBTHsiu_tDkK_4mRM_BNjQ_OGYW3DkQAuqE'
    },
    url: TT_REQ_PERM_URL,
  };
  return axios(options);
}

main();
