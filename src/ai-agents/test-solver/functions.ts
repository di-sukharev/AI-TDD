export const FUNCTIONS = {
  AWK: {
    name: "awk",
    description: "Search and process text in a file or input using AWK",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "The AWK pattern to search for",
        },
        filePath: {
          type: "string",
          description: "The relative file path to search for",
        },
      },
      required: ["pattern", "filePath"],
    },
  },

  GREP: {
    name: "grep",
    description: "Search for a pattern in text or files using grep",
    parameters: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "The regex pattern to search for",
        },
        filePath: {
          type: "string",
          description: "The relative file path to search for",
        },
        flags: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Optional flags to modify the grep behavior",
        },
      },
      required: ["pattern", "filePath"],
    },
  },

  FIND: {
    name: "find",
    description: "Locate files in a directory hierarchy",
    parameters: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description:
            "The starting point directory for the search, default is pwd",
        },
        namePattern: {
          type: "string",
          description: "Pattern to match file or directory names",
        },
        type: {
          type: "string",
          enum: ["file", "directory"],
          description: "Specify the type to search for",
        },
      },
      required: ["directory", "namePattern"],
    },
  },

  WRITE_CODE: {
    name: "write_code",
    description:
      "Modify code at a specified file path according to given instructions",
    parameters: {
      type: "object",
      properties: {
        modifications: {
          type: "array",
          description: "An array of modifications to apply to the code",
          items: {
            type: "object",
            properties: {
              filePath: {
                type: "string",
                description: "The absolute file path relative to the test file",
              },
              content: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    row: {
                      type: "string",
                      description: "The specific line of code to find",
                    },
                    action: {
                      type: "string",
                      enum: ["replace", "append", "prepend"],
                      description: "The action to perform on the 'row'",
                    },
                    with: {
                      type: "string",
                      description: "The code to insert",
                    },
                  },
                  required: ["row", "action", "with"],
                },
                description: "The content modifications to apply",
              },
            },
            required: ["filePath", "content"],
          },
        },
      },
      required: ["modifications"],
    },
  },

  // TODO: mb add ls, pwd
};
