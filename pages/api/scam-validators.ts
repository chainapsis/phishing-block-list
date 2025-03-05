// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { promises as fs } from "fs";
import Cors from "cors";

type Data = Record<string, string[]>;

interface ValidatorData {
  identifier: string;
  validatorAddresses: string[];
}

const cors = Cors({
  methods: ["GET"],
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // CORS 처리
  await new Promise<void>((resolve, reject) => {
    cors(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve();
    });
  });

  const directory: string = path.join(process.cwd(), "scam-validators");

  const promiseFiles = (await fs.readdir(directory)).map(
    async (fileName: string) => {
      const file: string = await fs.readFile(
        `${directory}/${fileName}`,
        "utf8"
      );

      const validatorAddresses: string[] =
        file.length > 0
          ? file
              .split("\n")
              .map((address: string) => address.replace(/[\n\r]/g, "").trim())
              .filter((address: string) => address.length > 0)
          : [];

      return {
        identifier: fileName.split(".txt")[0],
        validatorAddresses,
      };
    }
  );

  const response: Data = (await Promise.all(promiseFiles)).reduce(
    (obj: Record<string, string[]>, item: ValidatorData) =>
      Object.assign(obj, { [item.identifier]: item.validatorAddresses }),
    {}
  );

  res.status(200).json(response);
}
