import { AppError } from "./AppError";

/** A violated domain invariant (capacity exceeded, ineligible driver, etc.).
 *  Its message is safe to show the user. */
export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = "BusinessRuleError";
  }
}
