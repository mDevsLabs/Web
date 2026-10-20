#!/usr/bin/env node
// Exécute une commande dans un Job Object Windows qui plafonne la mémoire.
//
// POURQUOI CE SCRIPT
//
// Un `next build` sans plafond dépasse la mémoire disponible sur une machine
// de bureau : le processus est tué par le système sans laisser de trace utile,
// et le message d'erreur ne parle pas de mémoire. Le plafond rend l'échec
// EXPLICITE (allocation refusée) et permet de choisir un budget qui tient.
//
// COMMENT
//
// `CreateJobObject` + `JOBOBJECT_EXTENDED_LIMIT_INFORMATION` avec
// `JOB_OBJECT_LIMIT_JOB_MEMORY` : le kernel refuse toute allocation qui ferait
// dépasser le budget, et le processus reçoit une erreur explicite.
//
// L'API Win32 n'est pas exposée par Node : on passe par PowerShell, qui sait
// compiler du C#. Le code est écrit dans un FICHIER temporaire, et non
// passé en ligne de commande : PowerShell et Node y réinterprètent
// différemment les guillemets, et le code inline se retrouverait cassé.
//
// Usage : node scripts/run-with-memory-limit.mjs <budgetMo> <commande> [args…]

import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * P/Invoke : création du Job Object, pose de sa limite de mémoire, et
 * rattachement d'un processus.
 *
 * `Marshal.SizeOf` est générique et exact — PowerShell ne sait pas marshaller
 * une structure non gérée sans ambiguïté sur la taille, d'où le passage par
 * un fichier C# compilé.
 */
const SOURCE_CSHARP = `using System;
using System.Runtime.InteropServices;

public static class JobMemoryLimit {
  [StructLayout(LayoutKind.Sequential)]
  public struct IO_COUNTERS { public ulong a, b, c, d, e, f; }

  [StructLayout(LayoutKind.Sequential)]
  public struct JOBOBJECT_BASIC_LIMIT_INFORMATION {
    public long PerProcessUserTimeLimit;
    public long PerJobUserTimeLimit;
    public uint LimitFlags;
    public UIntPtr MinimumWorkingSetSize;
    public UIntPtr MaximumWorkingSetSize;
    public uint ActiveProcessLimit;
    public UIntPtr Affinity;
    public uint PriorityClass;
    public uint SchedulingClass;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION {
    public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
    public IO_COUNTERS IoInfo;
    public UIntPtr ProcessMemoryLimit;
    public UIntPtr JobMemoryLimit;
    public UIntPtr PeakProcessMemoryUsed;
    public UIntPtr PeakJobMemoryUsed;
  }

  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  private static extern IntPtr CreateJobObject(IntPtr attributes, string name);

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern bool SetInformationJobObject(
    IntPtr job, int infoClass, IntPtr info, uint length);

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern IntPtr OpenProcess(uint access, bool inherit, uint pid);

  [DllImport("kernel32.dll")]
  private static extern bool CloseHandle(IntPtr handle);

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern bool QueryInformationJobObject(
    IntPtr job, int infoClass, IntPtr info, uint length, IntPtr returnLength);

  private const int JOB_OBJECT_EXTENDED_LIMIT_INFORMATION_CLASS = 9;
  private const uint JOB_OBJECT_LIMIT_JOB_MEMORY = 0x00000200;
  private const uint PROCESS_ALL_ACCESS = 0x001F0FFF;

  /// Crée le Job Object et pose le plafond. Rend le handle.
  public static long Create(long budgetBytes) {
    IntPtr job = CreateJobObject(IntPtr.Zero, null);
    if (job == IntPtr.Zero) {
      throw new System.ComponentModel.Win32Exception(
        Marshal.GetLastWin32Error(), "CreateJobObject a échoué");
    }

    JOBOBJECT_EXTENDED_LIMIT_INFORMATION info =
      new JOBOBJECT_EXTENDED_LIMIT_INFORMATION();
    info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_JOB_MEMORY;
    info.JobMemoryLimit = new UIntPtr((ulong)budgetBytes);

    int size = Marshal.SizeOf(typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
    IntPtr buffer = Marshal.AllocHGlobal(size);
    try {
      Marshal.StructureToPtr(info, buffer, false);
      if (!SetInformationJobObject(
            job, JOB_OBJECT_EXTENDED_LIMIT_INFORMATION_CLASS, buffer, (uint)size)) {
        throw new System.ComponentModel.Win32Exception(
          Marshal.GetLastWin32Error(), "SetInformationJobObject a échoué");
      }
    } finally {
      Marshal.FreeHGlobal(buffer);
    }
    return job.ToInt64();
  }

  /// Rattache un processus au Job Object.
  public static void Assign(long jobHandle, uint pid) {
    IntPtr process = OpenProcess(PROCESS_ALL_ACCESS, false, pid);
    if (process == IntPtr.Zero) {
      throw new System.ComponentModel.Win32Exception(
        Marshal.GetLastWin32Error(), "OpenProcess a échoué");
    }
    try {
      if (!AssignProcessToJobObject(new IntPtr(jobHandle), process)) {
        throw new System.ComponentModel.Win32Exception(
          Marshal.GetLastWin32Error(), "AssignProcessToJobObject a échoué");
      }
    } finally {
      CloseHandle(process);
    }
  }

  /// Pic de mémoire atteint par le Job, en octets.
  public static long Peak(long jobHandle) {
    int size = Marshal.SizeOf(typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
    IntPtr buffer = Marshal.AllocHGlobal(size);
    try {
      if (!QueryInformationJobObject(
            new IntPtr(jobHandle), JOB_OBJECT_EXTENDED_LIMIT_INFORMATION_CLASS,
            buffer, (uint)size, IntPtr.Zero)) {
        return -1;
      }
      JOBOBJECT_EXTENDED_LIMIT_INFORMATION info =
        (JOBOBJECT_EXTENDED_LIMIT_INFORMATION)Marshal.PtrToStructure(
          buffer, typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
      return (long)info.PeakJobMemoryUsed.ToUInt64();
    } finally {
      Marshal.FreeHGlobal(buffer);
    }
  }
}
`;
/**
 * Script PowerShell : compile le C#, crée le Job Object, rattache le
 * processus cible, puis RESTE VIVANT.
 *
 * Le processus doit rester vivant : un Job Object est détruit quand son
 * dernier handle est fermé, et le handle n'appartient qu'au processus qui
 * l'a créé. Si le PowerShell rend la main, l'objet disparaît et le plafond
 * ne s'applique plus.
 *
 * Il expose aussi une COMMANDE : taper « peak » sur son entrée standard
 * renvoie le pic de mémoire atteint, en octets. C'est ce qui permet de
 * choisir le budget du tour suivant à partir d'une MESURE, et non d'une
 * estimation.
 */
const PS_PILOTE = `
$ErrorActionPreference = 'Stop'
Add-Type -Path $env:MAI_JOB_SOURCE
$job = [JobMemoryLimit]::Create([int64]$env:MAI_JOB_MEMORY_BYTES)
[JobMemoryLimit]::Assign($job, [uint32]$env:MAI_TARGET_PID)
Write-Output $job
# Boucle de commande : le pic de mémoire est demandé à la demande.
while ($true) {
  $commande = [Console]::In.ReadLine()
  if ($null -eq $commande) { break }
  if ($commande -eq "peak") {
    [Console]::Out.WriteLine([JobMemoryLimit]::Peak($job))
    [Console]::Out.Flush()
  } elseif ($commande -eq "stop") {
    break
  }
}
`;

/**
 * Crée le Job Object, y rattache le processus courant, et rend le handle.
 *
 * Le processus PowerShell qui porte le handle RESTE VIVANT : un Job Object
 * est détruit quand son dernier handle est fermé, et ce handle n'appartient
 * qu'au processus qui l'a créé. Le script le ferme à la fin (dans le
 * `finally`), ce qui détruit le Job Object — donc le plafond.
 */
async function creerJobObject(budgetOctets, sourceCs) {
  const pilote = spawn(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", PS_PILOTE],
    {
      env: {
        ...process.env,
        MAI_JOB_MEMORY_BYTES: budgetOctets.toString(),
        MAI_JOB_SOURCE: sourceCs,
        MAI_TARGET_PID: String(process.pid),
      },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    }
  );

  const erreurs = [];
  pilote.stderr.on("data", (bloc) => erreurs.push(bloc));

  // La PREMIÈRE ligne de la sortie standard est le handle. Les suivantes
  // sont les réponses aux demandes de pic de mémoire.
  let handleConnu = null;
  let attente = null;

  const traiter = (ligne) => {
    if (handleConnu === null) {
      handleConnu = Number.parseInt(ligne, 10);
      if (attente) {
        const { resolve } = attente;
        attente = null;
        resolve(handleConnu);
      }
      return;
    }
    if (attente) {
      const { resolve } = attente;
      attente = null;
      resolve(Number.parseInt(ligne, 10));
    }
  };

  let reste = "";
  pilote.stdout.on("data", (bloc) => {
    reste += bloc.toString("utf8");
    const lignes = reste.split(/\r?\n/);
    reste = lignes.pop() ?? "";
    for (const ligne of lignes) {
      const propre = ligne.trim();
      if (propre) {
        traiter(propre);
      }
    }
  });

  const handle = await new Promise((resolve, reject) => {
    const chrono = setTimeout(() => {
      reject(
        new Error(
          `Le Job Object n'a pas répondu à temps : ${Buffer.concat(erreurs).toString("utf8")}`
        )
      );
    }, 60_000);
    attente = { resolve };
    if (handleConnu !== null) {
      clearTimeout(chrono);
      attente = null;
      resolve(handleConnu);
    }
    pilote.on("exit", (code) => {
      clearTimeout(chrono);
      reject(
        new Error(
          `Le PowerShell du Job Object s'est arrêté (code ${code}) : ${Buffer.concat(erreurs).toString("utf8")}`
        )
      );
    });
  });

  /** Demande le pic de mémoire atteint par le Job, en octets. */
  const pic = () =>
    new Promise((resolve) => {
      attente = { resolve };
      pilote.stdin.write("peak\n");
    });

  return { handle, pic, pilote };
}

const [budgetMo, ...commande] = process.argv.slice(2);
if (!budgetMo || commande.length === 0) {
  console.error(
    "Usage : node scripts/run-with-memory-limit.mjs <budgetMo> <commande> [args…]"
  );
  process.exit(2);
}

const budget = Number.parseInt(budgetMo, 10);
if (!Number.isFinite(budget) || budget < 64) {
  console.error(`Budget de mémoire illisible : "${budgetMo}"`);
  process.exit(2);
}

// Le nombre de Travailleurs de Turbopack est borné de la même façon.
//
// `TURBO_TASKS_AVAILABLE_PARALLELISM` fixe le nombre de tâches Rust
// exécutées en parallèle. Sans lui, Turbopack prend le nombre de cœurs : sur
// une machine de bureau, un `next build` mobilise huit threads de
// compilation, dont chacun a son propre tas — c'est ce qui fait déborder le
// budget bien avant que le nombre de travailleurs de Next.js (`cpus`) ne
// soit atteint.
//
// La variable est déjà comprise dans `process.env` si l'appelant l'a posée ;
// on ne l'écrase donc pas.
const paralleles = process.env.TURBO_TASKS_AVAILABLE_PARALLELISM?.trim();
if (paralleles && !/^\d+$/.test(paralleles)) {
  console.warn(
    `[build] TURBO_TASKS_AVAILABLE_PARALLELISM="${paralleles}" est illisible : elle est ignorée.`
  );
  process.env.TURBO_TASKS_AVAILABLE_PARALLELISM = "";
  delete process.env.TURBO_TASKS_AVAILABLE_PARALLELISM;
}

const dossier = mkdtempSync(join(tmpdir(), "mai-job-"));
const sourceCs = join(dossier, "JobMemoryLimit.cs");
writeFileSync(sourceCs, SOURCE_CSHARP, "utf8");

let pilote = null;
let pic = null;
let atteint = Number.NaN;

try {
  const job = await creerJobObject(BigInt(budget) * 1024n * 1024n, sourceCs);
  pilote = job.pilote;
  pic = job.pic;

  console.log(
    `▸ Plafond de mémoire : ${budget} Mo pour « ${commande.join(" ")} »`
  );

  const enfant = spawn(commande[0], commande.slice(1), {
    env: process.env,
    stdio: "inherit",
    windowsHide: false,
  });

  const code = await new Promise((resolve) => {
    enfant.on("error", (error) => {
      console.error(`Échec du lancement : ${error.message}`);
      resolve(1);
    });
    enfant.on("exit", (codeSortie, signal) => {
      if (signal) {
        console.error(`Processus interrompu par le signal ${signal}`);
        resolve(1);
        return;
      }
      resolve(codeSortie ?? 1);
    });
  });

  // Le PIC de mémoire atteint est la mesure qui sert à choisir le budget du
  // tour suivant : c'est une donnée, pas une estimation. Un build qui a
  // échoué sur le plafond indique lui-même la valeur à dépasser.
  if (pic) {
    atteint = await pic();
    if (Number.isFinite(atteint) && atteint > 0) {
      const mo = Math.round(atteint / 1024 / 1024);
      console.log(
        `▸ Pic de mémoire atteint : ${mo} Mo (plafond : ${budget} Mo).`
      );
      if (code !== 0 && mo >= budget * 0.95) {
        console.log(
          `  Le plafond était atteint : relancez avec un budget supérieur à ${mo} Mo.`
        );
      }
    }
  }

  process.exit(code);
} finally {
  // Ferme l'entrée standard du PowerShell : il rend la main, et le Job
  // Object disparaît avec lui.
  pilote?.stdin?.end();
  rmSync(dossier, { force: true, recursive: true });
}
