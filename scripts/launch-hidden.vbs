Option Explicit
Dim fso, root, cmd, sh
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & root & "\scripts\launch.ps1"""
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = root
sh.Run cmd, 0, False
