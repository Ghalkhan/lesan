import _ from "lodash";

const makeNestedObjWithArrayItemsAsKeys = (arr: any, first: any) => {
  const reducer = (acc: any, item: any) => {
    return { [item]: acc };
  };
  return arr.reduceRight(reducer, first);
};

export const makeObjectData = (data: any) => {
  let dataCustom: any = {};
  Object.keys(data).map((key: any) => {
    if (data[key] === "" || data[key].toString() === "NaN") {
      delete data[key];
    } else {
      const arr: [] = key.split(" ");
      try {
        isNaN(data[key]) && (data[key] = JSON.parse(data[key]));
      } catch (error) {
        console.log(error.message);
      }
      _.defaultsDeep(
        dataCustom,
        makeNestedObjWithArrayItemsAsKeys(arr, data[key])
      );
    }
  });
  return dataCustom;
};
