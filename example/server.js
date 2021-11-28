import authenticate from "@assaf/react-one-tap/dist/server";

const clientId = process.env.GOOGLE_CLIENT_ID;
const users = ["hi@example.com"];

function authorize(handler) {
  return async function (req, res) {
    const { status, profile, message } = await authenticate({ clientId, req });
    if (!profile) return res.status(status).send(message);

    const isAuthorized =
      profile.email_verified && users.includes(profile.email);
    if (isAuthorized) handler(req, res);
    else res.status(403).send("Access denied");
  };
}

router.get("/customers", authorize(getCustomers));
