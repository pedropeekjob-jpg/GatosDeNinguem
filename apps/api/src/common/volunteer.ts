import { normalizePhone } from "@gn/domain";
import { createHash } from "node:crypto";

/** Until every volunteer has an account, the mobile number identifies them on shifts. */
export const volunteerIdFromPhone = (phone: string) => "tel-" + createHash("sha256").update(normalizePhone(phone)).digest("hex").slice(0, 16);
