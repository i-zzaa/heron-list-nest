import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('categoria')
@UseGuards(AuthGuard('jwt'))
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  get() {
    return this.categoryService.get();
  }

  @Get(':search')
  search(@Param('search') search: string) {
    return this.categoryService.search(search);
  }
}
