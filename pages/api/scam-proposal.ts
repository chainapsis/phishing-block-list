// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { promises as fs } from "fs";

type Data = {};

export default async function (
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const directory = path.join(process.cwd(), "scam-proposals");

  const promiseFiles = (await fs.readdir(directory)).map(async (fileName) => {
    const file = await fs.readFile(`${directory}/${fileName}`, "utf8");

    const proposalIds = file.length > 0 ? file.trim().split("\n") : [];

    proposalIds.forEach((proposalId, index) => {
      const splitId = proposalId.split("-");
      if (splitId.length > 1) {
        proposalIds.splice(index, 1);

        for (
          let i = Number.parseInt(splitId[0]);
          i <= Number.parseInt(splitId[1]);
          i++
        ) {
          proposalIds.push(`${i}`);
        }
      }
    });

    return {
      identifier: fileName.split(".txt")[0],
      proposalIds,
    };
  });

  const response = (await Promise.all(promiseFiles))
    .map((file) => file)
    .reduce(
      (obj, item) =>
        Object.assign(obj, { [item.identifier]: item.proposalIds }),
      {}
    );

  res.status(200).json(response);
}
