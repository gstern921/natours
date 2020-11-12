class APIFeatures {
  constructor(query, queryStringObj) {
    this.query = query;
    this.queryStringObj = queryStringObj;

    this.filter.bind(this);
    this.sort.bind(this);
    this.limitFields.bind(this);
    this.paginate.bind(this);
  }

  filter(filterableFields = []) {
    const queryObj = {};

    Object.keys(this.queryStringObj)
      .filter((key) => filterableFields.includes(key))
      .forEach((key) => {
        queryObj[key] = this.queryStringObj[key];
      });

    let convertedQueryObj = JSON.stringify(queryObj);
    convertedQueryObj = convertedQueryObj.replace(
      /\s*"(lte?|gte?|eq|ne)"\s*:/g,
      (m, p1) => {
        if (p1) {
          return `"$${p1}":`;
        }
      }
    );

    // console.log(convertedQueryObj);

    this.query = this.query.find(JSON.parse(convertedQueryObj));

    return this;
  }

  sort(sortableFields = []) {
    let sortProps = this.queryStringObj.sort;

    if (Array.isArray(sortProps)) {
      sortProps = sortProps[sortProps.length - 1];
    }

    if (typeof sortProps === 'string') {
      sortProps = sortProps.split(/\s*,\s*/);
    } else {
      sortProps = [];
    }

    const sortBy = sortProps
      .filter((prop) => sortableFields.includes(prop.replace(/^-/, '')))
      .join(' ')
      .trim();

    if (sortBy) {
      this.query = this.query.sort(sortBy);
    }
    this.query = this.query.sort('-_id');
    return this;
  }

  limitFields() {
    const requestedFields = this.queryStringObj.fields
      ? this.queryStringObj.fields.replace(/,/g, ' ').trim().split(' ')
      : [];

    const isHidingFields = requestedFields.every((field) => {
      return field[0] === '-' || field === '_id' || field === '-_id';
    });

    if (isHidingFields && !requestedFields.includes('-__v')) {
      requestedFields.push('-__v');
    }
    // console.log(requestedFields.join(' '));
    if (requestedFields.length) {
      const fields = requestedFields.join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const resultsPerPage =
      +this.queryStringObj.limit > 0 ? +this.queryStringObj.limit : 100;
    const pageNumber =
      +this.queryStringObj.page > 0 ? +this.queryStringObj.page : 1;

    // console.log(`resultsPerPage: ${resultsPerPage}`);
    // console.log(`pageNumber: ${pageNumber}`);

    const skipCount = resultsPerPage * (pageNumber - 1);
    this.query = this.query.skip(skipCount);
    this.query = this.query.limit(resultsPerPage);

    return this;
  }
}

module.exports = APIFeatures;
