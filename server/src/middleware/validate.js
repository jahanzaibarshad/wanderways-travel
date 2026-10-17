export function validate(schema) {
  return (request, response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success)
      return response
        .status(400)
        .json({ message: 'Please check your details', errors: result.error.flatten().fieldErrors });
    request.body = result.data;
    next();
  };
}
