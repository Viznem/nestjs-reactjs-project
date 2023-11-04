import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { storageConfig } from 'helpers/config';
import { extname } from 'path';

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(private userService:UserService){}

    @UseGuards(AuthGuard)
    @Get()
    findAll(@Query() query: FilterUserDto):Promise<User[]> {
        console.log(query)
        return this.userService.findAll(query);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    fineOne(@Param('id') id:string): Promise<User>{
        return this.userService.findOne(Number(id));
    }

    @Post()
    create(@Body() createUserDto: CreateUserDto): Promise<User>{
        return this.userService.create(createUserDto);
    }

    @UseGuards(AuthGuard)
    @Put(':id')
    update(@Param('id') id:string, @Body() updateUserDto: UpdateUserDto){
        return this.userService.update(Number(id), updateUserDto);
    }

    @UseGuards(AuthGuard)
    @Delete(':id')
    delete(@Param('id') id:string){
        return this.userService.delete(Number(id));
    }

    @Post('upload-avatar')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('avatar', {
        storage:storageConfig('avatar'),
        fileFilter: (req, file, cb) => {
            const ext = extname(file.originalname);
            const allowedExtArr = ['.jpg', '.jpeg', '.png']
            if(!allowedExtArr.includes(ext.toLowerCase())){
                req.fileValidationError = `Wrong file type. ${allowedExtArr.toString()}`
                cb(null, false);
            }else{
                const fileSize = parseInt(req.headers['content-length']);
                if(fileSize > 1024*1024*5){
                    req.fileValidationError = `File size too large`;
                    cb(null,false);
                }else{
                    cb(null, true);
                }
            }
        }
    }))
    uploadAvatar(@Req() req:any, @UploadedFile() file:Express.Multer.File) {
        console.log('upload avatar')
        console.log('user data', req.user_data)
        console.log(file)
        if(req.fileValidationError){
            throw new BadRequestException(req.fileValidationError);
        }
        if(!file){
            throw new BadRequestException('File is required');
        }
        
        return this.userService.updateAvatar(req.user_data.id, file.destination + '/' + file.filename);
    }
}
