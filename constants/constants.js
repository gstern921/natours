exports.ONE_SECOND = 1000;
exports.ONE_MINUTE = exports.ONE_SECOND * 60;
exports.ONE_HOUR = exports.ONE_MINUTE * 60;
exports.ONE_DAY = exports.ONE_HOUR * 24;
exports.ONE_WEEK = exports.ONE_DAY * 7;

exports.HTTP_OK = 200;
exports.HTTP_CREATED = 201;
exports.HTTP_NO_CONTENT = 204;
exports.HTTP_NOT_MODIFIED = 304;
exports.HTTP_BAD_REQUEST = 400;
exports.HTTP_UNAUTHORIZED = 401;
exports.HTTP_FORBIDDEN = 403;
exports.HTTP_NOT_FOUND = 404;
exports.HTTP_SERVER_ERROR = 500;

exports.STATUS_SUCCESS = 'success';
exports.STATUS_ERROR = 'error';
exports.STATUS_FAIL = 'fail';

exports.DEFAULT_ERROR_MESSAGE_NO_DOCUMENT_FOUND_BY_ID =
  'No document found with that ID';
exports.DEFAULT_ID_PARAM_NAME = 'id';
exports.DEFAULT_DOC_NAME = 'doc';

exports.ROLE_USER = 'user';
exports.ROLE_GUIDE = 'guide';
exports.ROLE_LEAD_GUIDE = 'lead-guide';
exports.ROLE_ADMIN = 'admin';

exports.JWT_SECRET = process.env.JWT_SECRET;

exports.ROLE_ALL = [
  exports.ROLE_USER,
  exports.ROLE_LEAD_GUIDE,
  exports.ROLE_GUIDE,
  exports.ROLE_ADMIN,
];
