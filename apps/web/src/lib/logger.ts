type Fields = Record<string, unknown>;

function line(level: string, msg: string, fields?: Fields) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  };
  console.log(JSON.stringify(entry));
}

export const log = {
  info(msg: string, fields?: Fields) {
    line("info", msg, fields);
  },
  error(msg: string, fields?: Fields) {
    line("error", msg, fields);
  },
  warn(msg: string, fields?: Fields) {
    line("warn", msg, fields);
  },
};
