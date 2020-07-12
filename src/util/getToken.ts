import { AuthToken } from "../models/User";
export default (user: any, kind: string) => user.tokens.find((token: AuthToken) => token.kind === kind);