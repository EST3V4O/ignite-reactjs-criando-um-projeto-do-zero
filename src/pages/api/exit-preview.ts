import url from 'url';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function ExitPreview(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Exit the current user from "Preview Mode". This function accepts no args.
  res.clearPreviewData();

  const queryObject = url.parse(req.url, true).query;
  const redirectUrl =
    queryObject && queryObject.currentUrl ? queryObject.currentUrl : '/';

  res.writeHead(307, { Location: redirectUrl });
  res.end();
}
