import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SAMPLES: { title: string; filename: string; text: string }[] = [
  {
    title: 'Algorithms — Sorting & Complexity',
    filename: 'algorithms.txt',
    text: `Big-O notation describes how an algorithm's running time or space grows with input size n.
O(1) is constant time, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, and O(n^2) quadratic.
Bubble sort repeatedly swaps adjacent out-of-order pairs; its average and worst-case complexity is O(n^2).
Merge sort divides the array, sorts halves recursively, then merges; it runs in O(n log n) time and needs O(n) extra space.
Quick sort partitions around a pivot; average case is O(n log n), but worst case is O(n^2) without careful pivot choice.
Binary search finds a target in a sorted array by repeatedly discarding half the search space, in O(log n) time.
A hash table maps keys to buckets via a hash function; average lookup is O(1), but collisions require chaining or open addressing.
Dijkstra's algorithm finds shortest paths in a weighted graph with non-negative edges using a priority queue.
Dynamic programming solves overlapping subproblems by storing intermediate results, as in the Fibonacci sequence or knapsack problem.
A greedy algorithm makes locally optimal choices hoping for a global optimum; it works for Huffman coding but not for all problems.`,
  },
  {
    title: 'Databases — Relational Model & SQL',
    filename: 'databases.txt',
    text: `A relational database organizes data into tables (relations) of rows and columns with a defined schema.
A primary key uniquely identifies each row; a foreign key references a primary key in another table to express relationships.
Normalization reduces redundancy: first normal form requires atomic values; third normal form removes transitive dependencies.
ACID properties are Atomicity, Consistency, Isolation, and Durability — guarantees for reliable transactions.
SELECT retrieves rows; WHERE filters; JOIN combines tables; GROUP BY aggregates; ORDER BY sorts results.
An index speeds lookups by maintaining a separate structure (often a B-tree) at the cost of write overhead and storage.
A transaction is a unit of work that either commits entirely or rolls back on failure.
Isolation levels (read uncommitted, read committed, repeatable read, serializable) trade consistency for concurrency.
NoSQL systems (document, key-value, column, graph) relax schema rigidity for scale or flexible data models.
ORMs map objects to tables but can hide expensive queries; understanding the generated SQL remains important.`,
  },
  {
    title: 'Git — Version Control Basics',
    filename: 'git.txt',
    text: `Git is a distributed version control system that tracks changes to files as snapshots called commits.
A repository contains the full history; cloning copies it locally so work can continue offline.
The working tree holds editable files; the staging area (index) prepares the next commit; commit history is immutable by default.
git add stages changes; git commit records them with a message; git status and git diff inspect the state.
Branches are lightweight pointers to commits; the default branch is often main or master.
Merging combines histories; a fast-forward moves the pointer, while a three-way merge creates a merge commit.
Conflicts occur when the same lines change on different branches and must be resolved manually.
git pull fetches and integrates remote changes; git push publishes local commits to a remote.
Rebasing replays commits onto another base for a linear history but rewrites commit hashes.
Pull requests (or merge requests) let teams review code before integrating into a shared branch.`,
  },
  {
    title: 'Computer Networks — Layers & Protocols',
    filename: 'networks.txt',
    text: `The OSI model has seven layers; the TCP/IP model commonly uses four: link, internet, transport, and application.
IP addresses identify hosts; IPv4 uses 32 bits, IPv6 uses 128 bits. Routing forwards packets between networks.
TCP provides reliable, ordered, connection-oriented delivery; UDP is connectionless and does not guarantee delivery.
HTTP is an application protocol for the web; HTTPS adds TLS encryption for confidentiality and integrity.
DNS maps human-readable domain names to IP addresses through a hierarchical distributed database.
A MAC address identifies a network interface on the local link; ARP resolves IP to MAC on Ethernet LANs.
Firewalls filter traffic by rules; NAT translates private addresses for internet access.
Latency is delay; bandwidth is capacity; throughput is achieved transfer rate under real conditions.
Congestion control (e.g., TCP windowing) prevents senders from overwhelming the network.
CDNs cache content geographically closer to users to reduce latency and origin load.`,
  },
  {
    title: 'Operating Systems — Processes & Memory',
    filename: 'os.txt',
    text: `An operating system manages hardware resources and provides abstractions such as processes, files, and devices.
A process is a running program with its own address space; a thread shares that space within a process.
Context switching saves and restores CPU state when the scheduler moves between tasks.
CPU scheduling algorithms include FCFS, SJF, round-robin, and priority scheduling.
Virtual memory maps virtual addresses to physical frames, often using paging; a page fault loads missing pages from disk.
Deadlock occurs when processes wait circularly for each other's resources; prevention, avoidance, and detection are strategies.
A mutex serializes access to critical sections; semaphores can also coordinate producer-consumer patterns.
The file system organizes persistent storage into directories and files with metadata (inodes on Unix-like systems).
System calls are the controlled interface between user programs and the kernel.
A container isolates processes with shared kernel; a virtual machine emulates hardware with a separate guest OS.`,
  },
];

async function main(): Promise<void> {
  const email = 'demo@focusdeck.app';
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: 'Demo Student',
    },
  });

  for (const sample of SAMPLES) {
    const existing = await prisma.document.findFirst({
      where: { userId: user.id, title: sample.title },
    });
    if (existing) continue;

    await prisma.document.create({
      data: {
        userId: user.id,
        title: sample.title,
        originalFilename: sample.filename,
        extractedText: sample.text,
        wordCount: sample.text.trim().split(/\s+/).length,
      },
    });
  }

  console.log(`Seeded demo user ${email} / demo1234 with ${SAMPLES.length} sample documents.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
