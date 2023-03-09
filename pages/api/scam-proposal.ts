// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { promises as fs } from "fs";
import Cors from "cors";

type Data = {};

const cors = Cors({
  methods: ["GET"],
});

export default async function (
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await new Promise((resolve, reject) => {
    cors(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
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
        : [];

    proposalIds.forEach((proposalId, index) => {
      const splitId = proposalId.split("-");
      if (splitId.length > 1) {
        proposalIds.splice(index, 1);
        proposalIds.push(
          ...Array.from(
            {
              length:
                Number.parseInt(splitId[1]) - Number.parseInt(splitId[0]) + 1,
            },
            (v, i) => (i + Number.parseInt(splitId[0])).toString()
          )
        );
      }
    });

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
