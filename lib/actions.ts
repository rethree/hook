import { AnyAction } from "redux";
import { ofType, unionize, UnionOf } from "unionize";
import { Dependency, _ } from "./types";
import { Options } from "@recubed/async";

export const Actions = unionize(
  {
    $$RECUBED_MARK_STALE: ofType<Dependency<_>[]>(),
    $$RECUBED_SAVE_FETCHED: ofType<Options<unknown>[]>()
  },
  {
    tag: "type",
    value: "payload"
  }
);

export const isUnion = (
  x: AnyAction | UnionOf<typeof Actions>
): x is UnionOf<typeof Actions> => x.type.split("_")[0] === "$$RECUBED";
