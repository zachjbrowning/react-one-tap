import { authenticate } from "@assaf/react-one-tap";

const clientId = process.env.GOOGLE_CLIENT_ID;
const users = ["hi@example.com"];

function authorize(handler) {
  return async function (request, response) {
    const { status, profile, message } = await authenticate({
      clientId,
      req: request,
    });
    if (!profile) return response.status(status).send(message);

    const isAuthorized =
      profile.email_verified && users.includes(profile.email);
    if (isAuthorized) handler(request, response);
    else response.status(403).send("Access denied");
  };
}

router.get("/customers", authorize(getCustomers));
