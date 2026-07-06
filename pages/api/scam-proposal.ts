// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { promises as fs } from "fs";
import Cors from "cors";

type Data = Record<string, string[]>;

const cors = Cors({
  methods: ["GET"],
});

function expandProposalId(proposalId: string): string[] {
  const [start, end, ...rest] = proposalId.split("-");
  if (end === undefined || rest.length > 0) {
    return [proposalId];
  }

  const startNumber = Number.parseInt(start, 10);
  const endNumber = Number.parseInt(end, 10);
  if (Number.isNaN(startNumber) || Number.isNaN(endNumber)) {
    return [proposalId];
  }

  return Array.from({ length: endNumber - startNumber + 1 }, (_, index) =>
    (index + startNumber).toString()
  );
}

export default async function (
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await new Promise<void>((resolve, reject) => {
    cors(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve();
    });
  });

  const directory = path.join(process.cwd(), "scam-proposals");

  const promiseFiles = (await fs.readdir(directory)).map(async (fileName) => {
    const file = await fs.readFile(`${directory}/${fileName}`, "utf8");

    const proposalIds =
      file.length > 0
        ? file
            .split("\n")
            .map((proposalId: string) =>
              proposalId.replace(/[\n\r]/g, "").trim()
            )
            .filter((proposalId: string) => proposalId.length > 0)
            .flatMap(expandProposalId)
        : [];

    return {
      identifier: fileName.split(".txt")[0],
      proposalIds,
    };
  });

  const response = (await Promise.all(promiseFiles)).reduce(
    (obj, item) => Object.assign(obj, { [item.identifier]: item.proposalIds }),
    {}
  );

  res.status(200).json(response);
}
