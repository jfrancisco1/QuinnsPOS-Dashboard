// Dates in the app are Philippine local time (UTC+8): run tests in that zone on every
// machine (and on EAS), so day boundaries behave like for the shop owners.
module.exports = () => {
  process.env.TZ = 'Asia/Manila';
};
