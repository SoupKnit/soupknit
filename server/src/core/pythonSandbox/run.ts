const { spawn } = require("child_process");

type RunInPythonSandboxArgs = {
  input: string;
  files: string[];
  scriptPath: string;
  onData: (data: string) => void;
  onError: (error: string) => void;
  onClose: (code: number) => void;
};

export function runInPythonSandbox({
  input,
  files,
  scriptPath,
  onData,
  onError,
  onClose,
}: RunInPythonSandboxArgs) {
  const pythonProcess = spawn("python3", [scriptPath]);
  console.log(files);
  pythonProcess.stdout.on("data", (data: Buffer) => {
    onData(data.toString());
  });

  pythonProcess.stderr.on("data", (data: Buffer) => {
    onError(data.toString());
  });

  pythonProcess.on("close", (code: number) => {
    onClose(code);
  });

  pythonProcess.stdin.write(input);
  pythonProcess.stdin.end();
}
