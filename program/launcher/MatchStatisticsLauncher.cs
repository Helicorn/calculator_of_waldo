using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal sealed class Program {
    [STAThread]
    private static int Main() {
        try {
            string here = Path.GetDirectoryName(
                System.Reflection.Assembly.GetExecutingAssembly().Location);
            if (string.IsNullOrEmpty(here)) {
                here = Environment.CurrentDirectory;
            }

            string jar1 = Path.Combine(here, "MatchStatistics.jar");
            string jar2 = Path.Combine(here, "ojdbc11.jar");
            if (!File.Exists(jar1) || !File.Exists(jar2)) {
                MessageBox.Show(
                    "같은 폴더에 MatchStatistics.jar, ojdbc11.jar 가 있어야 합니다.",
                    "MatchStatistics",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return 1;
            }

            string java = FindJava();
            if (java == null) {
                MessageBox.Show(
                    "java.exe를 찾을 수 없습니다.\nJDK를 설치하고 PATH 또는 JAVA_HOME을 설정하세요.",
                    "MatchStatistics",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return 1;
            }

            string cp = jar1 + ";" + jar2;
            var psi = new ProcessStartInfo {
                FileName = java,
                Arguments = "-Dfile.encoding=UTF-8 -cp \"" + cp + "\" program.MatchStatistics",
                UseShellExecute = false,
                WorkingDirectory = here,
            };
            using (Process p = Process.Start(psi)) {
                p.WaitForExit();
                return p.ExitCode;
            }
        } catch (Exception ex) {
            MessageBox.Show(ex.Message, "MatchStatistics", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }

    private static string FindJava() {
        string jh = Environment.GetEnvironmentVariable("JAVA_HOME");
        if (!string.IsNullOrEmpty(jh)) {
            string j = Path.Combine(jh.TrimEnd('\\', '/'), "bin", "java.exe");
            if (File.Exists(j)) {
                return j;
            }
        }

        string pathVar = Environment.GetEnvironmentVariable("PATH");
        if (!string.IsNullOrEmpty(pathVar)) {
            foreach (string dir in pathVar.Split(';')) {
                if (string.IsNullOrWhiteSpace(dir)) {
                    continue;
                }
                string j = Path.Combine(dir.Trim(), "java.exe");
                if (File.Exists(j)) {
                    return j;
                }
            }
        }

        try {
            using (var k = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\JavaSoft\JDK")) {
                if (k != null) {
                    string ver = k.GetValue("CurrentVersion") as string;
                    if (ver != null) {
                        using (var kv = k.OpenSubKey(ver)) {
                            if (kv != null) {
                                string home = kv.GetValue("JavaHome") as string;
                                if (!string.IsNullOrEmpty(home)) {
                                    string j = Path.Combine(home, "bin", "java.exe");
                                    if (File.Exists(j)) {
                                        return j;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch {
            // ignore
        }

        return null;
    }
}
