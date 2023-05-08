/** @jsx h */
import { h } from "https://esm.sh/preact@10.5.15";
import { useState } from "https://esm.sh/preact@10.5.15/hooks";

export const Page = (
  { schemasObj, actsObj } = { schemasObj: {}, actsObj: {} },
) => {
  const [selectedService, setSelectedService] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [selectedAct, setSelectedAct] = useState("");
  const [avalibaleSetFields, setAvalibaleSetFields] = useState(null);
  const [avalibaleGetFields, setAvalibaleGetFields] = useState(null);
  const [formData, setFormData] = useState({});
  const [response, setResponse] = useState(null);

  const handleChange = (event: any) => {
    const { name, value, type } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const deepen = (obj: Record<string, any>) => {
    const result = {};

    // For each object path (property key) in the object
    for (const objectPath in obj) {
      // Split path into component parts
      const parts = objectPath.split(".");

      // Create sub-objects along path as needed
      let target = result;
      while (parts.length > 1) {
        const part = parts.shift();
        target = (target as any)[part!] = (target as any)[part!] || {};
      }

      // Set value at end of path
      (target as any)[parts[0]] = obj[objectPath];
    }

    return result;
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const details = deepen(formData);

    /* for (const key in formData) { */
    /*   key.split(".").map((k, i, values) => { */
    /*     body = (body as any)[k] = i == values.length - 1 */
    /*       ? (formData as any)[key] */
    /*       : {}; */
    /*   }); */
    /* } */

    const sendedRequest = await fetch("http://localhost:8000/lesan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service: selectedService,
        contents: selectedMethod,
        wants: { model: selectedSchema, act: selectedAct },
        details,
      }),
    });

    const jsonSendedRequest = await sendedRequest.json();
    setResponse(jsonSendedRequest);
  };

  const renderGetFileds = (getField: any, keyName: string, margin: number) => {
    return (
      <div style={{ marginLeft: `${margin + 10}px` }}>
        {keyName} :
        {Object.keys(getField["schema"]).map(childKeys => {
          return getField["schema"][childKeys].type === "enums"
            ? (
              <div style={{ marginLeft: `${margin + 10}px` }}>
                <label htmlFor={childKeys}>{childKeys}:</label>
                <input
                  placeholder={`${keyName}.${childKeys}`}
                  type="number"
                  id={`${keyName}.${childKeys}`}
                  value={(formData as any)[`get.${keyName}.${childKeys}`]}
                  name={`get.${keyName}.${childKeys}`}
                  onChange={handleChange}
                />
              </div>
            )
            : renderGetFileds(
              getField["schema"][childKeys],
              `${keyName}.${childKeys}`,
              margin + 10,
            );
        })}
      </div>
    );
  };

  return (
    <div>
      <div>
        <label>
          select service?

          <select
            value={selectedService}
            onChange={(event: any) => {
              setSelectedService(event.target.value);
              setSelectedMethod("");
              setSelectedSchema("");
              setAvalibaleGetFields(null);
              setAvalibaleSetFields(null);
              setFormData({});
            }}
          >
            <option value=""></option>
            {Object.keys(actsObj).map((service, index) => (
              <option value={service}>{service}</option>
            ))}
          </select>
        </label>

        <p>selected service is {selectedService}!</p>
      </div>

      <div>
        <label>
          select dynamic or static?

          <select
            value={selectedMethod}
            onChange={(event: any) => {
              setSelectedMethod(event.target.value);
              setSelectedSchema("");
              setAvalibaleGetFields(null);
              setAvalibaleSetFields(null);
              setFormData({});
            }}
          >
            <option value=""></option>
            <option value="dynamic">dynamic</option>
            <option value="static">static</option>
          </select>
        </label>

        <p>selected method is {selectedMethod}!</p>
      </div>

      {selectedService && selectedMethod && (
        <div>
          <label>
            select schema?

            <select
              value={selectedSchema}
              onChange={(event: any) => {
                setSelectedSchema(event.target.value);
                setAvalibaleGetFields(null);
                setAvalibaleSetFields(null);
                setFormData({});
              }}
            >
              <option value=""></option>
              {Object.keys((actsObj as any)[selectedService][selectedMethod])
                .map(
                  (
                    schema,
                  ) => <option value={schema}>{schema}</option>,
                )}
            </select>
          </label>

          <p>selected schema is {selectedSchema}!</p>
        </div>
      )}

      {selectedService && selectedMethod && selectedSchema && (
        <div>
          <label>
            select act?

            <select
              value={selectedAct}
              onChange={(event: any) => {
                const actObj =
                  (actsObj as any)[selectedService][selectedMethod][
                    selectedSchema
                  ][
                    event.target.value
                  ]["validator"]["schema"];

                setSelectedAct(event.target.value);
                setAvalibaleGetFields(actObj["get"]["schema"]);
                setAvalibaleSetFields(actObj["set"]["schema"]);
                setFormData({});
              }}
            >
              <option value=""></option>
              {Object.keys(
                (actsObj as any)[selectedService][selectedMethod][
                  selectedSchema
                ],
              )
                .map(
                  (
                    schema,
                  ) => <option value={schema}>{schema}</option>,
                )}
            </select>
          </label>

          <p>selected atc is {selectedAct}!</p>
        </div>
      )}

      {selectedService && selectedMethod && selectedSchema &&
        avalibaleSetFields && avalibaleGetFields && (
        <div>
          <form onSubmit={handleSubmit}>
            <div>
              set inputs :
              {Object.keys(
                avalibaleSetFields,
              ).map(setField => (
                <div>
                  <label htmlFor={setField}>{setField}:</label>
                  <input
                    placeholder={setField}
                    id={setField}
                    value={(formData as any)[`set.${setField}`]}
                    name={`set.${setField}`}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>

            <br />
            <hr />
            <br />

            <div>
              get inputs :
              {Object.keys(
                avalibaleGetFields,
              ).map(getField => {
                return ((avalibaleGetFields as any)[getField] as any).type ===
                    "enums"
                  ? (
                    <div>
                      <label htmlFor={getField}>{getField}:</label>
                      <input
                        placeholder={getField}
                        id={getField}
                        value={(formData as any)[`get.${getField}`]}
                        name={`get.${getField}`}
                        type="number"
                        onChange={handleChange}
                      />
                    </div>
                  )
                  : renderGetFileds(
                    (avalibaleGetFields as any)[getField],
                    getField,
                    0,
                  );
              })}
            </div>
            <button type="submit">Submit</button>
          </form>
        </div>
      )}

      {response && (
        <div>
          <br />
          <hr />
          <br />
          {JSON.stringify(response, null, 2)}
        </div>
      )}
    </div>
  );
};
