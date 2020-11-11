const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const {
  HTTP_OK,
  HTTP_NO_CONTENT,
  HTTP_NOT_FOUND,
  STATUS_SUCCESS,
  DEFAULT_ERROR_MESSAGE_NO_DOCUMENT_FOUND_BY_ID,
  DEFAULT_ID_PARAM_NAME,
  DEFAULT_DOC_NAME,
} = require('../constants/constants');
const AppError = require('../utils/appError');

exports.handleDeleteOneById = (
  Model,
  options = {
    idParam: DEFAULT_ID_PARAM_NAME,
    notFoundMessage: DEFAULT_ERROR_MESSAGE_NO_DOCUMENT_FOUND_BY_ID,
  }
) =>
  catchAsync(async (req, res, next) => {
    const idParam =
      typeof options.idParam === 'string'
        ? options.idParam
        : DEFAULT_ID_PARAM_NAME;

    const notFoundMessage =
      typeof options.notFoundMessage === 'string'
        ? options.notFoundMessage
        : DEFAULT_ERROR_MESSAGE_NO_DOCUMENT_FOUND_BY_ID;

    const id = req.params[idParam];
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      return next(new AppError(notFoundMessage, HTTP_NOT_FOUND));
    }

    return res
      .status(HTTP_NO_CONTENT)
      .json({ status: STATUS_SUCCESS, data: null });
  });

exports.handleUpdateOneById = (
  Model,
  options = {
    idParam: DEFAULT_ID_PARAM_NAME,
    notFoundMessage: DEFAULT_ID_PARAM_NAME,
    docName: DEFAULT_DOC_NAME,
  }
) =>
  catchAsync(async (req, res, next) => {
    const idParam =
      typeof options.idParam === 'string'
        ? options.idParam
        : DEFAULT_ID_PARAM_NAME;

    const notFoundMessage =
      typeof options.notFoundMessage === 'string'
        ? options.notFoundMessage
        : DEFAULT_ERROR_MESSAGE_NO_DOCUMENT_FOUND_BY_ID;

    const docName =
      typeof options.docName === 'string' ? options.docName : DEFAULT_DOC_NAME;

    const id = req.params[idParam];

    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      const err = new AppError(notFoundMessage, HTTP_NOT_FOUND);
      return next(err);
    }

    return res
      .status(HTTP_OK)
      .json({ status: STATUS_SUCCESS, data: { [docName]: doc } });
  });

exports.createOne = (
  Model,
  options = {
    docName: DEFAULT_DOC_NAME,
  }
) =>
  catchAsync(async (req, res, next) => {
    const docName =
      typeof options.docName === 'string' ? options.docName : DEFAULT_DOC_NAME;

    const doc = await Model.create(req.body);

    return res.status(HTTP_OK).json({
      status: STATUS_SUCCESS,
      data: {
        [docName]: doc,
      },
    });
  });

exports.handleGetOneById = (
  Model,
  options = {
    idParam: DEFAULT_ID_PARAM_NAME,
    notFoundMessage: DEFAULT_ID_PARAM_NAME,
    docName: DEFAULT_DOC_NAME,
    removeFields: [],
    populateOptions: null,
  }
) =>
  catchAsync(async (req, res, next) => {
    const idParam =
      typeof options.idParam === 'string'
        ? options.idParam
        : DEFAULT_ID_PARAM_NAME;

    const notFoundMessage =
      typeof options.notFoundMessage === 'string'
        ? options.notFoundMessage
        : DEFAULT_ERROR_MESSAGE_NO_DOCUMENT_FOUND_BY_ID;

    const docName =
      typeof options.docName === 'string' ? options.docName : DEFAULT_DOC_NAME;

    const id = req.params[idParam];

    const { populateOptions } = options;

    let query = Model.findById(id);

    if (populateOptions && typeof populateOptions === 'object') {
      query = query.populate(populateOptions);
    }

    const doc = await query;

    if (!doc) {
      const err = new AppError(notFoundMessage, HTTP_NOT_FOUND);
      return next(err);
    }

    const fieldsBlacklist = Array.isArray(options.removeFields)
      ? options.removeFields
      : [];

    fieldsBlacklist.forEach((field) => {
      doc[field] = undefined;
    });

    return res.status(HTTP_OK).json({
      status: STATUS_SUCCESS,
      data: {
        [docName]: doc,
      },
    });
  });

exports.handleGetAll = (
  Model,
  options = {
    filterableProps: [],
    sortableProps: [],
    docName: DEFAULT_DOC_NAME,
  }
) =>
  catchAsync(async (req, res, next) => {
    const filterableProps = options.filterableProps || [];
    const sortableProps = options.sortableProps || [];

    const features = new APIFeatures(Model.find(), req.query)
      .filter(filterableProps)
      .sort(sortableProps)
      .limitFields()
      .paginate();

    const docs = await features.query;

    const docName =
      typeof options.docName === 'string' ? options.docName : DEFAULT_DOC_NAME;

    return res.status(HTTP_OK).json({
      status: STATUS_SUCCESS,
      results: docs.length,
      data: {
        [docName]: docs,
      },
    });
  });
