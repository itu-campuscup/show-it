import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "./layout";

test("renders a shared link to the Show IT repository", () => {
  const markup = renderToStaticMarkup(
    <RootLayout>
      <main>Show IT</main>
    </RootLayout>,
  );

  expect(markup).toContain("Interested in how Show IT works?");
  expect(markup).toContain('href="https://github.com/itu-campuscup/show-it"');
  expect(markup).toContain('target="_blank"');
  expect(markup).toContain('rel="noreferrer"');
});
