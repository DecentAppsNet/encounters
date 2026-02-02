import IfStatement from "./IfStatement";
import CallStatement from "./CallStatement";
import AssignStatement from "./AssignStatement";

type Statement = IfStatement | AssignStatement | CallStatement;

export default Statement;