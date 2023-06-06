import { IsNotEmpty, Matches } from 'class-validator';
import { RegExHelper } from 'src/util/regex';

export class AuthDTO {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @Matches(RegExHelper.username)
  password: string;
}
