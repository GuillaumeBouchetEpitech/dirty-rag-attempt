
export interface ITool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: {
        [key in string]: {
          type: "string";
          enum?: string[];
          description: string;
        };
      };
      required: string[];
    };
  };
}

