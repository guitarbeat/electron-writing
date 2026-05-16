## 2024-05-16 - Add ARIA Labels and Keyboard Focus States to Icon-Only Buttons
**Learning:** The Smeemo project's `button-playful` base CSS does not include default focus states, causing several icon-only UI components to be difficult to operate via keyboard navigation or screen readers.
**Action:** Always verify icon-only buttons have `aria-label`s, and make sure `focus-visible` states are explicitly styled if they override default behavior (e.g. `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`).
