
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';

export default async function (req, res, next) {
  try {
    
    const {userCode}=req.session;
    if(!userCode) throw new Error('로그인이 필요합니다.');
    const account = await prisma.account.findFirst({
      where: { userCode: +userCode },
    });
    if (!account) {
      res.clearCookie('authorization');
      throw new Error('토큰 사용자가 존재하지 않습니다.');
    }

    // req.user에 사용자 정보를 저장합니다.
    req.account = account;

    next();
  } catch (error) {
    return res.status(400).json({message:error.message});
  }
}