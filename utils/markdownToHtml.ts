import remark from 'remark';
import html from 'remark-html';
import prism from 'remark-prism';

export default async function markdownToHtml(
  markdown: string
): Promise<string> {
  const result = await remark()
    .use(html)
    .use(prism, {
      // plugins: ['treeview'],
    })
    .process(markdown);
  return result.toString();
}
