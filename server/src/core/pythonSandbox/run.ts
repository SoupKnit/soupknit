const { spawn } = require("child_process");

type RunInPythonSandboxArgs = {
  input: string;
  files: string[];
  // ... more, as needed
};

export function runInPythonSandbox({ input }: RunInPythonSandboxArgs) {
  const pythonProcess = spawn("python3", ["../packages/python/workbook.py"]);

  let outputData = "";
  pythonProcess.stdout.on("data", (data: any) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on("data", (data: any) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on("close", (code: number) => {
    if (code !== 0) {
      return "Python script exited with code " + code;
    } else {
      console.log(outputData);
      return "That might not have worked";
    }
  });

  pythonProcess.stdin.write(input);
  pythonProcess.stdin.end();
}
