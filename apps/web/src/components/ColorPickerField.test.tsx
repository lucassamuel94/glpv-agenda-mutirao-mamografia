import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "@/components/Form";
import { ColorPickerField } from "@/components/ColorPickerField";

function setup() {
  return render(
    <Form onSubmit={() => {}} defaultValues={{ primaryColor: "#4f46e5" }}>
      <ColorPickerField name="primaryColor" label="Cor principal" />
    </Form>,
  );
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Cor principal:/ }));
  return screen.getByLabelText("Cor personalizada em hexadecimal");
}

describe("ColorPickerField — campo hexadecimal", () => {
  it("aplica a cor quando o hex digitado fica completo", async () => {
    const user = userEvent.setup();
    setup();
    const input = await openPicker(user);

    await user.clear(input);
    await user.type(input, "#DC2626");

    expect(input).toHaveValue("#DC2626");
    expect(
      screen.getByRole("button", { name: /Cor principal: #DC2626/ }),
    ).toBeInTheDocument();
  });

  it("não aplica hex incompleto, mas deixa continuar digitando", async () => {
    const user = userEvent.setup();
    setup();
    const input = await openPicker(user);

    await user.clear(input);
    await user.type(input, "#DC2");

    expect(input).toHaveValue("#DC2");
    // cor efetiva segue a anterior enquanto o hex não fecha 6 dígitos
    expect(
      screen.getByRole("button", { name: /Cor principal: #4F46E5/ }),
    ).toBeInTheDocument();
  });

  it("volta a espelhar a cor efetiva ao sair do campo", async () => {
    const user = userEvent.setup();
    setup();
    const input = await openPicker(user);

    await user.clear(input);
    await user.type(input, "#ZZ");
    await user.tab();

    expect(input).toHaveValue("#4F46E5");
  });
});
