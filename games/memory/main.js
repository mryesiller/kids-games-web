// main.js — memory sayfa girişi: sözleşmeyi shell'e bağlar.
import game from "./game.js";
import { bootGame } from "../../shared/game-shell.js";
import { t } from "../../shared/i18n.js";

bootGame(game, { hint: t("game.howto.memory"), hintIcon: "🃏" });
