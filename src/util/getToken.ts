import { AuthToken } from "../models/User";
export default (user, kind) => user.tokens.find((token: AuthToken) => token.kind === kind);