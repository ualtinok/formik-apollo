import { GraphQLError } from "graphql";
import { ApolloError, isApolloError } from "apollo-client";
import { Problems, ValidationError, UserInputError } from "./types";

const isString = (value: any) => typeof value === "string";
const isObject = (value: any) => value && typeof value === "object";

/**
 * Indicates that an error is a validation error.
 */
export const VALIDATION_ERROR = "VALIDATION_ERROR";

/**
 * Indicates that an error is a bad user input error.
 */
export const BAD_USER_INPUT = "BAD_USER_INPUT";

/**
 * Create a validation error. Useful for testing.
 */
export const createValidationError = (message: string, problems: Problems) => {
  const gqlError = new GraphQLError(
    message,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    { code: VALIDATION_ERROR, problems }
  );

  return new ApolloError({
    errorMessage: message,
    graphQLErrors: [gqlError]
  });
};

/**
 * Create a bad user input error. Useful for testing.
 */

export const createBadUserInputError = (message: string, problems: Problems) => {
  const gqlError = new GraphQLError(
      message,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { code: BAD_USER_INPUT, problems }
  );

  return new ApolloError({
    errorMessage: message,
    graphQLErrors: [gqlError]
  });
};

/**
 * Get the code for an error.
 */
export const getErrorCode = (error: Error): string | undefined =>
  error instanceof GraphQLError &&
  isObject(error.extensions) &&
  error.extensions!.code;

/**
 * Is the error a formik handled error?
 */
export const isHandledError = (error: any, errorType: string): error is (ValidationError | UserInputError) =>
  isObject(error) &&
  isObject(error.extensions) &&
  isObject(error.extensions!.problems) &&
  error.extensions!.code === errorType;

/**
 * Get the form status based on an error.
 */
export const getStatusFromError = (error: Error) => ({
  error: error.message.replace(/^GraphQL error: /, "")
});

/**
 * Extract all validation errors from an error.
 */
export const getValidationErrors = (
  error: ApolloError | GraphQLError | Error
): Record<string, string> => {
  if (error && isApolloError(error)) {
    return error.graphQLErrors.reduce(
      (acc, e) => Object.assign(acc, getValidationErrors(e)),
      {}
    );
  }

  if (error && (isHandledError(error, VALIDATION_ERROR) || isHandledError(error, BAD_USER_INPUT))) {
    return Object.entries(error.extensions.problems).reduce(
      (acc, [key, value]) => {
        const message = Array.isArray(value) ? value[0] : value;
        const updates = isString(message) ? { [key]: message } : {};
        return Object.assign(acc, updates);
      },
      {}
    );
  }

  return {};
};
